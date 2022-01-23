import axios from "axios";
import styled from "styled-components";
import { typeAlert, Alert } from "../clan";
import React, { FC, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AdminState } from "../../../../redux/reducers/general/admin";
import { StateInterface, Dispatch } from "../../../../redux/reduxIndex";
import { imageObjectContentCss } from "../../../middlewares/ModeTeams";

const ManageComponent = styled.div<{ disabled: boolean }>`
  height: 100%;
  display: ${({ disabled }) => (disabled ? "none" : "block")};
`;

export const VerifyUsersManage: FC<{ selector: number }> = ({ selector }) => {
  const { usersVerify } = useSelector<StateInterface, AdminState>((state) => state.admin);
  const dispatch = useDispatch<Dispatch<AdminState>>();

  var [loading, setLoader] = useState<string | number>(0x0);
  var [alertSeconder, setAlert] = useState<typeAlert | null>(null);

  var notifyError = () => setAlert({ type: "error", msg: "Failed, Something went wrong" });

  const fetcher = (data?: any) => {
    let wn: any = window,
      token = localStorage.token,
      endpoint = wn.env.ENDPOINT;
    if (!token || !endpoint) return null;
    return new Promise<any>(async (resolve) => {
      try {
        const Fetched = await axios.request({
          url: `${endpoint}/me/request-verify`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: JSON.stringify(data || {}),
        });
        resolve(Fetched);
      } catch (e) {
        resolve(null);
      }
    });
  };

  const dofc = async (userPid: string, accepted: boolean, i: number | string) => {
    if (!userPid) return;
    let packetId = accepted ? 0x2 : 0x3;
    setLoader(i);
    const dofnc = await fetcher({ type: packetId, target: userPid });
    if (!dofnc) return notifyError();
    let result = dofnc.data;
    if (result && "status" in result && result.status === true) {
      if (usersVerify) {
        let usersUpdated:  any = usersVerify;
        delete usersUpdated[userPid];
        dispatch({
          type: "UPDATE_ADMIN_STATE",
          payload: {
            usersVerify: usersUpdated
          },
        });
      }
      setAlert(null);
    } else {
      setLoader(0x0);
      notifyError();
    }
  };

  useEffect(() => {
    if (selector === 0x5) {
      (async () => {
        const usersFetched = await fetcher({ type: 0x0 });
        if (!usersFetched) return notifyError();
        let result = usersFetched.data;
        if (result && "status" in result && result.status === true && "content" in result) {
          setAlert(null);
          dispatch({
            type: "UPDATE_ADMIN_STATE",
            payload: {
              usersVerify: result.content
            },
          });
        } else notifyError();
      })();
    }
  }, [selector]);

  return (
    <ManageComponent disabled={selector !== 0x5}>
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>
      {usersVerify ? (
        <div className="form">
          <div className="label">USERS VERIFICATION WATING</div>
          <div className="skins">
            {Object.keys(usersVerify).map((user, i) => (
              <div className="skin" key={i}>
                <div className="care">
                  <div
                    className="circle"
                    style={imageObjectContentCss(usersVerify[user].id, usersVerify[user].avatar)}
                  ></div>
                </div>
                <div className="name">{usersVerify[user].name}</div>
                <div className="buttons">
                  <div className="button green" onClick={() => dofc(user, true, 0x1 + i + "")}>
                    {loading === 0x1 + i + "" ? <div className="loader-button" /> : <i className="fal fa-check" />}
                  </div>
                  <div className="button red" onClick={() => dofc(user, false, 0x2 + 1 + "x")}>
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
    </ManageComponent>
  );
};
