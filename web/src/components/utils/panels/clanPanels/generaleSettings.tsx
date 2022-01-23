import axios from "axios";
import { FC, useState } from "react";
import { overlayState } from "../../../../redux/reducers/general/overly";
import { ClanState, ClanObject } from "../../../../redux/reducers/general/clanReducer";
import { NumberFormator } from "../../NumberFormator";
import { Alert, typeAlert } from "../clan";
import { uploadImage } from "../../uploadImage";
import { validatorText, validatorURL } from "../../validator";
import { useDispatch } from "react-redux";
import { Dispatch } from "../../../../redux/reduxIndex";

interface SettingClanState {
  account: overlayState["account"];
  clan: ClanState["clan"];
  selector: number;
}

var inputsForms: ClanObject = {};

export const GeneraleSetting: FC<SettingClanState> = ({ clan, account, selector }) => {
  const [images, setImageObject] = useState<any>({});
  const dispatch = useDispatch<Dispatch<ClanState>>();
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

  const setTheClan = async () => {
    let wn = window as any;
    let token = localStorage.getItem("token");
    let endpoint = wn.env.ENDPOINT;
    if (!token || !endpoint || !clan) {
      return alert("Token isn't exists, or somthing went wrong, please refresh");
    }
    let formDataRequired: any = {};

    for (let prop of ["name", "tag", "bg", "skin"]) {
      if (["bg", "skin"].indexOf(prop) >= 0) {
        formDataRequired[prop] = prop in images ? images[prop] : clan[prop];
      } else if (!check(prop) && validatorText(inputsForms[prop], prop === "tag")) {
        formDataRequired[prop] = inputsForms[prop];
      } else formDataRequired[prop] = clan ? clan[prop] : null;
    }

    if (!Object.keys(formDataRequired).length) {
      setAlert({ type: "error", msg: "انت لم تغير شيء بعد!" });
      return;
    }

    setButtonStatus(0x1);

    try {
      const inputsFormsRequest = await axios.request({
        url: `${endpoint}/me/edite_clan`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: JSON.stringify(formDataRequired),
      });

      setButtonStatus(0x0);

      if (inputsFormsRequest) {
        let result = inputsFormsRequest.data || {};
        if (result) {
          if ("status" in result && result.status === true) {
            setAlert({ type: "success", msg: "The changes updated successfuly!" });
            dispatch({
              type: "UPDATE_CLAN_STATE",
              payload: {
                clan: { ...clan, ...formDataRequired },
              },
            });
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
  };

  if (!clan || selector !== 0x0 || !account || clan.users[account.pid].admin !== true) return null;

  return (
    <div className="clan-maker">
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>

      <div className="content-forms">
        <div className="form-input" key={"name"}>
          <div className="label"> إسم الكلان</div>
          <input
            type="text"
            placeholder="إسم الكلان"
            defaultValue={clan?.name || ""}
            onChange={(e) => (inputsForms["name"] = e.target.value)}
          />
        </div>

        <div className="form-input" key={"tag"}>
          <div className="label">شعار الكلان</div>
          <input
            type="text"
            placeholder="شعار الكلان"
            defaultValue={clan?.tag || ""}
            onChange={(e) => (inputsForms["tag"] = e.target.value)}
          />
        </div>

        <div className="form-input" key={"bg"}>
          <div className="label">خلفية الكلان</div>
          <div className="bg">
            <div
              className="bg-preview"
              style={{ backgroundImage: `url(${"bg" in images ? images.bg : clan?.bg})` }}
            ></div>

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
              style={{ backgroundImage: `url(${"skin" in images ? images.skin : clan?.skin})` }}
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
        <div className="button" onClick={() => buttonStatus !== 0x1 && setTheClan()}>
          {buttonStatus === 0x1 ? <div className="loader-button" /> : "حفظ"}
        </div>
      </div>
    </div>
  );
};
