import axios from "axios";
import styled from "styled-components";
import { typeAlert, Alert } from "../clan";
import React, { FC, useState } from "react";

const ChangeProperty = styled.div<{ disabled: boolean }>`
  height: 100%;
  display: ${({ disabled }) => (disabled ? "none" : "block")};
`;

var inputsPropertys: any = { type: "balance" };

export const ChangePropertys: FC<{ selector: number }> = ({ selector }) => {
  var [loading, setLoader] = useState<boolean>(false);
  var [alertSeconder, setAlert] = useState<typeAlert | null>(null);
  var c = (t: string, o: any) => !(t in o);

  const notifyError = (s?: string) => setAlert({ type: "error", msg: s ?? "Failed, Something went wrong" });

  const fetcherUpdate = async () => {
    let wn: any = window,
      token = localStorage.token,
      endpoint = wn.env.ENDPOINT;
    let authenticate = () => {
      localStorage.removeItem("token");
      let wn: any = window;
      wn.onunload = wn.onbeforeunload = null;
      wn.location.href = `${endpoint}/auth/discord`;
    };
    if (
      !token ||
      !endpoint ||
      c("value", inputsPropertys) ||
      c("pid", inputsPropertys) ||
      c("type", inputsPropertys) ||
      !inputsPropertys.value ||
      !inputsPropertys.pid ||
      !inputsPropertys.type
    )
      return notifyError();
    setLoader(true);
    const savedChanges = await axios.request({
      url: `${endpoint}/me/change_property`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        ...inputsPropertys,
      }),
    });
    setLoader(false);
    if (savedChanges) {
      let result = savedChanges.data;
      if (c("status", result) || result.status !== true) {
        return notifyError("message" in result ? result.message : undefined);
      }
      if (inputsPropertys.pid === "pid") {
        authenticate();
      }
      setAlert({
        type: "success",
        msg: "All changes has been saved",
      });
    }
  };

  return (
    <ChangeProperty disabled={selector !== 0x4}>
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>
      <div className="form">
        <div className="label">PID USER</div>
        <input
          type="text"
          onChange={(e) => (inputsPropertys["pid"] = e.target.value)}
          placeholder="PUT THE ID OF USER"
        />
      </div>
      <div className="form">
        <div className="label">PROPERTY</div>
        <select onChange={(e) => (inputsPropertys["type"] = e.target.value)}>
          {(window as any).propertysAllowed.map((property: string, i: number) => (
            <option value={property} key={i}>
              {property}
            </option>
          ))}
        </select>
      </div>
      <div className="form">
        <div className="label">VALUE</div>
        <input type="text" placeholder="put the value" onChange={(e) => (inputsPropertys["value"] = e.target.value)} />
      </div>
      <div className="button-creation" onClick={() => !loading && fetcherUpdate()}>
        {loading === true ? <div className="loader-button" /> : "SAVE"}
      </div>
    </ChangeProperty>
  );
};
