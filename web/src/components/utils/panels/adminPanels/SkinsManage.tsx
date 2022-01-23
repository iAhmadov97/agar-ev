import axios from "axios";
import styled from "styled-components";
import { typeAlert, Alert } from "../clan";
import React, { FC, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AdminState, SkinState } from "../../../../redux/reducers/general/admin";
import { StateInterface, Dispatch } from "../../../../redux/reduxIndex";

const SkinsManageComponent = styled.div<{ disabled: boolean }>`
  height: 100%;
  display: ${({ disabled }) => (disabled ? "none" : "block")};
`;

export const SkinsManage: FC<{ selector: number }> = ({ selector }) => {
  const { skinsWating } = useSelector<StateInterface, AdminState>((state) => state.admin);
  const dispatch = useDispatch<Dispatch<AdminState>>();

  var [loading, setLoader] = useState<string | number>(0x0);
  var [alertSeconder, setAlert] = useState<typeAlert | null>(null);

  var notifyError = () => setAlert({ type: "error", msg: "Failed, Something went wrong" });

  const update = (data: any) => {
    if (!data) return;
    dispatch({
      type: "UPDATE_ADMIN_STATE",
      payload: data,
    });
  };

  const fetcher = (data?: any) => {
    let wn: any = window,
      token = localStorage.token,
      endpoint = wn.env.ENDPOINT;
    if (!token || !endpoint) return null;
    return new Promise<any>(async (resolve) => {
      try {
        const skinsFetched = await axios.request({
          url: `${endpoint}/me/manage_skins_wait`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: JSON.stringify(data || {}),
        });
        resolve(skinsFetched);
      } catch (e) {
        resolve(null);
      }
    });
  };

  const dofc = async (skin: string, accepted: boolean, i: number | string) => {
    if (!skin) return;
    let packetId = accepted ? 0x1 : 0x2;
    setLoader(i);
    const dofnc = await fetcher({ s: skin, t: packetId });
    if (!dofnc) return notifyError();
    let result = dofnc.data;
    if (result && "status" in result && result.status === true) {
      if (skinsWating) {
        let skinsUpdated = skinsWating;
        delete skinsUpdated[skin];
        update({
          skinsWating: skinsUpdated,
        });
      }
      setAlert(null);
    } else {
      setLoader(0x0);
      notifyError();
    }
  };

  useEffect(() => {
    if (selector === 0x3) {
      (async () => {
        const skinsFetched = await fetcher();
        if (!skinsFetched) return notifyError();
        let result = skinsFetched.data;
        if (result && "status" in result && result.status === true && "content" in result) {
          setAlert(null);
          update({
            skinsWating: result.content,
          });
        } else notifyError();
      })();
    }
  }, [selector]);

  return (
    <SkinsManageComponent disabled={selector !== 0x3}>
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>
      {skinsWating ? (
        <div className="form">
          <div className="label">SKINS WATING</div>
          <div className="skins">
            {Object.keys(skinsWating).map((skin, i) => (
              <div className="skin" key={i}>
                <div className="care">
                  <div
                    className="circle"
                    style={{ backgroundImage: `url(${skinsWating && skinsWating[skin].url})` }}
                  ></div>
                </div>
                <div className="buttons">
                  <div className="button green" onClick={() => dofc(skin, true, 0x1 + i + "")}>
                    {loading === 0x1 + i + "" ? <div className="loader-button" /> : <i className="fal fa-check" />}
                  </div>
                  <div className="button red" onClick={() => dofc(skin, false, 0x2 + 1 + "x")}>
                    {loading === 0x2 + i + "x" ? <div className="loader-button" /> : <i className="fal fa-times" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="loader-small"></div>
      )}
    </SkinsManageComponent>
  );
};
