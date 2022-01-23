import axios from "axios";
import styled from "styled-components";
import { typeAlert, Alert } from "../clan";
import React, { FC, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AdminState } from "../../../../redux/reducers/general/admin";
import { StateInterface, Dispatch } from "../../../../redux/reduxIndex";

const ContentComponent = styled.div<{ disabled: boolean }>`
  display: ${({ disabled }) => (disabled ? "none" : "block")};
  .watcher {
    .labed {
      display: flex;
      justify-content: space-between;
      border-radius: 3px;
      padding: 8px 10px;
      width: 90%;
      margin: 5px 0;
      background: var(--main-background-black-opacity-hoved);
      .title {
        font-size: 14px;
      }
    }
  }
`;

var inpusForms: any = { color_role: "blue" };

export const RoleCreation: FC<{ selector: number }> = ({ selector }) => {
  const { roles } = useSelector<StateInterface, AdminState>((state) => state.admin);
  const dispatch = useDispatch<Dispatch<AdminState>>();

  var [buttonLoading, setButtonLoading] = useState<boolean>(false);
  var [permissionObject, setPermissionObject] = useState<any>({ ADMIN: false, MUTE: false, BAN: false, KILL: false });
  var [alertSeconder, setAlert] = useState<typeAlert | null>(null);

  const updatePropPermission = (prop: string, answer: boolean) => {
    if (!prop) return;
    setPermissionObject({
      ...permissionObject,
      [prop]: answer,
    });
  };

  const checkIfInside = (target: string, object: any) => {
    return !(target in object);
  };

  const cleanup = () => {
    let l = (object: any) => {
      let ps: any = {};
      for (let perm in object) {
        if (perm.indexOf("color") === -1) {
          ps[perm] = false;
        }
      }
      return ps;
    };
    inpusForms = l(inpusForms);
    setPermissionObject(l(permissionObject));
  };

  const createRole = async () => {
    let endpoint = (window as any).endpoint,
      token = localStorage.getItem("token");
    if (!endpoint || !token) return;
    if (checkIfInside("name_role", inpusForms) || checkIfInside("color_role", inpusForms) ||  checkIfInside("max_time", inpusForms)) {
      setAlert({ type: "error", msg: "The name or color is empty" });
      return;
    }
    setButtonLoading(true);
    let permissions: any = {};
    for (let perm in permissionObject) permissions[perm.toLowerCase()] = permissionObject[perm];
    let lay = {
      called: inpusForms.name_role, // NAME
      color: inpusForms.color_role, // COLOR mustbe contain hex or rgba color
      max_time: inpusForms.max_time,
      permission: permissions, // Object permissions
    };
    const createdRole = await axios.request({
      url: `${endpoint}/me/add_role`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      data: JSON.stringify(lay),
    });
    setButtonLoading(false);
    if (createdRole) {
      let result = createdRole.data;
      if (checkIfInside("status", result)) return;
      if (result.status === false) return setAlert({ type: "error", msg: result.message || "❎ something went wrong" });
      cleanup();
      dispatch({
        type: "UPDATE_ADMIN_STATE",
        payload: {
          roles: Object.assign(roles, { [lay.called]: lay }),
        },
      });
      setAlert({ type: "success", msg: "✅ The role was created successfully" });
    }
  };
  return (
    <ContentComponent id="role-creation" disabled={selector !== 0x0}>
      <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>
      <div className="form">
        <div className="label">NAME ROLE</div>
        <input
          type="text"
          placeholder="role name"
          onChange={(e) => console.log((inpusForms["name_role"] = e.target.value))}
        />
      </div>
      <div className="form">
        <div className="label">COLOR ROLE</div>
        <input
          type="text"
          placeholder="color role e.g. blue,red,green"
          defaultValue="blue"
          onChange={(e) => (inpusForms["color_role"] = e.target.value)}
        />
      </div>
      <div className="form">
        <div className="label">MAX TIME</div>
        <input
          type="text"
          placeholder="max time e.g. 1,2 | 1 = 1 minute"
          onChange={(e) => (inpusForms["max_time"] = e.target.value)}
        />
      </div>
      <div className="form">
        <div className="label">PERMISSION</div>
        <div className="watcher">
          {Object.keys(permissionObject).map((prop, i) => (
            <div className="labed" key={i}>
              <div className="title">{prop}</div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={permissionObject["ADMIN"] ? true : permissionObject[prop]}
                  onChange={(e) =>
                    (prop !== "ADMIN" ? permissionObject["ADMIN"] !== true : true) &&
                    updatePropPermission(prop, e.target.checked)
                  }
                />
                <span
                  className="slider"
                  style={{ cursor: permissionObject["ADMIN"] && prop !== "ADMIN" ? "not-allowed" : "pointer" }}
                ></span>
              </label>
            </div>
          ))}
        </div>
      </div>
      <div
        className="button-creation"
        style={buttonLoading ? { cursor: "not-allowed" } : {}}
        onClick={() => !buttonLoading && createRole()}
      >
        {!buttonLoading ? "CREATE" : <div className="loader-button"></div>}
      </div>
    </ContentComponent>
  );
};
