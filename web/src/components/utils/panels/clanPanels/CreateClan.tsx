import axios from "axios";
import { FC, useState } from "react";
import { overlayState } from "../../../../redux/reducers/general/overly";
import { ClanState, ClanObject } from "../../../../redux/reducers/general/clanReducer";
import { NumberFormator } from "../../NumberFormator";
import { Alert, typeAlert } from "../clan";
import { uploadImage } from "../../uploadImage";
import { validatorText, validatorURL } from "../../validator";

interface CreateClanState {
  account: overlayState["account"];
  selector: number;
  prix: number;
}

var inputsForms: ClanObject = {};

export const CreationClan: FC<CreateClanState> = ({ account, prix, selector }) => {
  const [images, setImageObject] = useState<any>({});
  const [buttonStatus, setButtonStatus] = useState<number>(0x0);
  const [alertSeconder, setAlert] = useState<typeAlert | null>(null);

  var uploadBGRf: HTMLInputElement | null = null;
  var uploadSkinRf: HTMLInputElement | null = null;

  const ImageUploader = async (file: any, type: string) => {
    setButtonStatus(type === "skin" ? 0x2 : 0x3);
    const upload = await uploadImage(file);
    setButtonStatus(0x0);
    if (upload && typeof upload === "string" && type && (type === "bg" || type === "skin")) {
      if ((!account || account.role.admin !== true) && !upload.match(/(png|jpeg|jpg)+$/)) {
        setAlert({ type: "error", msg: "لايسمح بهاذا النوع من الصور" });
        return;
      }
      setImageObject({ ...images, [type]: upload });
    }
  };

  const check = (t: string, o?: any) => {
    return !(t in (o || inputsForms));
  };

  const buyClan = async () => {
    let wn = window as any;

    if (!Object.keys(inputsForms).length) {
      return setAlert({ type: "error", msg: "انت لم تغير شيء بعد!" });
    }

    let token = localStorage.getItem("token");
    let endpoint = wn.env.ENDPOINT;
    if (!token || !endpoint) {
      return alert("Token isn't exists, or somthing went wrong, please refresh");
    }

    if (account && "balance" in account && account.balance < prix) {
      return setAlert({ type: "error", msg: "نقاطك ليست كافيه لشراء وضع الكلان" });
    }

    if (!check("name") && validatorText(inputsForms.name as string)) {
      if (!check("tag") && validatorText(inputsForms.tag as string, true)) {
        if (!check("bg", images) && validatorURL(images.bg as string, true)) {
          if (!check("skin", images) && validatorURL(images.skin as string, true)) {
            setButtonStatus(0x1);
            try {
              const inputsFormsRequest = await axios.request({
                url: `${endpoint}/me/create_clan`,
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                data: JSON.stringify(Object.assign(inputsForms, images)),
              });

              setButtonStatus(0x0);

              if (inputsFormsRequest) {
                let result = inputsFormsRequest.data || {};
                if (result) {
                  if ("status" in result && result.status === true) {
                    setAlert({ type: "success", msg: "The changes updated successfuly!" });
                    wn.sendCloseClient();
                    wn.onbeforeunload = null;
                    wn.onunload = null;
                    location.reload();
                  } else {
                    setAlert({ type: "error", msg: result.message });
                  }
                } else throw new Error("Error something went wrong");
              } else throw new Error("Error something went wrong, or maybe check your connection");
            } catch (e) {
              setButtonStatus(0x0);
              setAlert({ type: "error", msg: String(e) });
              console.log(e);
            }
          } else setAlert({ type: "error", msg: "something went wrong on your skin, reupload" });
        } else setAlert({ type: "error", msg: "something went wrong on your background, reupload" });
      } else setAlert({ type: "error", msg: "your tag is incorrect" });
    } else
      setAlert({
        type: "error",
        msg:
          inputsForms.name && inputsForms.name.length < 5 ? "The name mustbe more than 5 letters" : "your name is incorrect",
      });
  };

  if (!account || selector !== 0x1) return null;
  return (
    <div className="clan-joiner">
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>

      <div className="content-forms">
        <div className="form-input" key={"name"}>
          <div className="label"> إسم الكلان</div>
          <input type="text" placeholder="إسم الكلان" onChange={(e) => (inputsForms["name"] = e.target.value)} />
        </div>

        <div className="form-input" key={"tag"}>
          <div className="label">شعار الكلان</div>
          <input type="text" placeholder="شعار الكلان" onChange={(e) => (inputsForms["tag"] = e.target.value)} />
        </div>

        <div className="form-input" key={"bg"}>
          <div className="label">خلفية الكلان</div>
          <div className="bg">
            <div className="bg-preview" style={"bg" in images ? { backgroundImage: `url(${images.bg})` } : {}}></div>

            <input
              ref={(e) => (uploadBGRf = e)}
              accept="image/png, image/jpeg"
              style={{ visibility: "collapse", width: "0px" }}
              type="file"
              onChange={(e) => e.target.files && ImageUploader(e.target.files[0], "bg")}
            />
            <div
              className="button-select gradient-text"
              onClick={() => uploadBGRf && buttonStatus !== 0x3 && uploadBGRf.click()}
            >
              {buttonStatus === 0x3 ? <div className="loader-button" /> : "اختر الخلفية"}
            </div>
          </div>
        </div>

        <div className="form-input" key={"skin"}>
          <div className="label">سكن للكلان</div>
          <div className="bg">
            <div
              className="skin-preview"
              style={"skin" in images ? { backgroundImage: `url(${images.skin})` } : {}}
            ></div>
            <input
              ref={(e) => (uploadSkinRf = e)}
              accept="image/png, image/jpeg"
              style={{ visibility: "collapse", width: "0px" }}
              type="file"
              onChange={(e) => e.target.files && ImageUploader(e.target.files[0], "skin")}
            />
            <div
              className="button-select gradient-text"
              onClick={() => uploadSkinRf && buttonStatus !== 0x2 && uploadSkinRf.click()}
            >
              {buttonStatus === 0x2 ? <div className="loader-button" /> : "إختر السكن"}
            </div>
          </div>
        </div>

        <div className="hr"></div>
        <div className="title-sider gradient-text">عملية الشراء</div>

        <div className="buy-form">
          {prix ? (
            <span className="prix">
              <span className="total">إجمالي</span>
              <span className="prix-real">{prix} نقطة</span>
            </span>
          ) : null}

          <div className="buy-button" onClick={() => buttonStatus !== 0x1 && buyClan()}>
            {buttonStatus === 0x1 ? <div className="loader-button" /> : "شراء"}
          </div>
        </div>
      </div>
    </div>
  );
};
