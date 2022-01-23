import axios from "axios";
import styled from "styled-components";
import { typeAlert, Alert } from "../clan";
import React, { FC, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
// import { AdminState } from "../../../../redux/reducers/general/admin";
import { StateInterface, Dispatch } from "../../../../redux/reduxIndex";
import { overlayState } from "../../../../redux/reducers/general/overly";

const ClanStuffsAll = styled.div<{ disabled: boolean }>`
  display: ${({ disabled }) => (disabled ? "none" : "block")};
`;

var inputs: any = {};

export const ClanStuffs: FC<{ selector: number }> = ({ selector }) => {
  const { account, loadingClans } = useSelector<StateInterface, overlayState>((state) => state.overaly);
  const dispatch = useDispatch<Dispatch<overlayState>>();

  var [buttonLoading, setButtonLoading] = useState<boolean>(false);
  var [alertSeconder, setAlert] = useState<typeAlert | null>(null);

  const changeOwnerShip = async () => {
    let check = (t: string, o: any) => !(t in o),
      token = localStorage.token,
      endpoint = (window as any).endpoint;
    if (!token || !endpoint) return;
    if (check("pid", inputs) || check("target", inputs) || !inputs.pid || !inputs.target) {
      return setAlert({ type: "error", msg: "Failed, please continue typing" });
    }
    setButtonLoading(true);
    const clanUpdated = await axios.request({
      url: `${endpoint}/me/ownership_clan`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      data: JSON.stringify({ ...inputs }),
    });
    setButtonLoading(false);
    if (clanUpdated) {
      let result = clanUpdated.data;
      if (check("status", result)) return;
      if (result.status === false) {
        return setAlert({ type: "error", msg: result.message || "Failed, ❎ something went wrong" });
      }
      if ((account && inputs["pid"] === account.pid) && inputs["target"] === account.pid) {
        dispatch({
          type: "UPDATE_OVERALY_STATE",
          payload: {
            loadingClans: false,
          },
        });
      }
      setAlert({ type: "success", msg: "✅ The clan was updated successfully" });
    }
  };
  return (
    <ClanStuffsAll disabled={selector !== 0x2}>
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>
      <div className="form">
        <div className="label">CHANGE OWNERSHIP</div>
        <div className="form">
          <div className="label">PID USER FROM</div>
          <input
            type="text"
            placeholder="Put the pid of user still have a clan"
            onChange={(e) => (inputs["pid"] = e.target.value)}
          />
        </div>
        <div className="form">
          <div className="label">PID USER TO</div>
          <input
            type="text"
            placeholder="Put the pid of user you wanna give him that"
            onChange={(e) => (inputs["target"] = e.target.value)}
          />
        </div>
        <div
          className="button-creation"
          style={buttonLoading ? { cursor: "not-allowed" } : {}}
          onClick={() => !buttonLoading && changeOwnerShip()}
        >
          {!buttonLoading ? "CREATE" : <div className="loader-button"></div>}
        </div>
      </div>
    </ClanStuffsAll>
  );
};
