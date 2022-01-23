import axios from "axios";
import styled from "styled-components";
import { typeAlert, Alert } from "../clan";
import { FC, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AdminState } from "../../../../redux/reducers/general/admin";
import { StateInterface, Dispatch } from "../../../../redux/reduxIndex";

const RoleManageComponent = styled.div<{ disabled: boolean }>`
  display: ${({ disabled }) => (disabled ? "none" : "block")};
  height: 100%;
`;

type Roles = AdminState["roles"];

var inputs: any = {};

export const RoleManage: FC<{ selector: number }> = ({ selector }) => {
  const { roles, wrappers } = useSelector<StateInterface, AdminState>((state) => state.admin);
  const dispatch = useDispatch<Dispatch<AdminState>>();

  var [buttonLoading, setButtonLoading] = useState<boolean>(false);
  var [alertSeconder, setAlert] = useState<typeAlert | null>(null);
  var [loading, setLoader] = useState<boolean>(false);

  const giveRole = async () => {
    try {
      let endpoint = (window as any).endpoint,
        token = localStorage.token,
        role = "role" in inputs ? inputs.role : null,
        pid = "pid" in inputs ? inputs.pid : null;

      if (!roles || !role || !pid || !(role in roles))
        return setAlert({ type: "error", msg: "The role does not exists or you wrong while you typing" });
      if (!endpoint || !token) {
        return;
      }
      setButtonLoading(true);
      const roleDone = await axios.request({
        url: `${endpoint}/me/give_role`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: JSON.stringify({ role, pid }),
      });
      setButtonLoading(false);
      let result = roleDone.data;
      if (!result) throw new Error("error");
      if ("status" in result && result.status === true) {
        inputs = {};
        setAlert({ type: "success", msg: `He was given the role successfully` });
      } else {
        if (!("message" in result)) throw new Error("error");
        setAlert({ type: "error", msg: result.message });
      }
    } catch (e) {
      setAlert({ type: "error", msg: `something went wrong` });
    }
  };

  const removeRole = async (role: string) => {
    try {
      let endpoint = (window as any).endpoint,
        token = localStorage.token;
      if (!roles || !(role in roles)) return setAlert({ type: "error", msg: "The role does not exists" });
      if (!endpoint || !token) {
        return;
      }
      const rolesRemoved = await axios.request({
        url: `${endpoint}/me/remove_role`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: JSON.stringify({ role }),
      });
      let result = rolesRemoved.data;
      if (!result) throw new Error("error");
      if ("status" in result && result.status === true) {
        let rolesUpdated = roles;
        delete rolesUpdated[role];
        dispatch({
          type: "UPDATE_ADMIN_STATE",
          payload: {
            roles: rolesUpdated,
          },
        });
        setAlert({ type: "success", msg: `[${role}] was removed succefully` });
      } else {
        if (!("message" in result)) throw new Error("error");
        setAlert({ type: "error", msg: result.message });
      }
    } catch (e) {
      setAlert({ type: "error", msg: `something went wrong` });
    }
  };

  const tranformPermissionObjectToTitle = (object: any): string => {
    let r = "";
    for (let perm in object) r += `${perm.toLowerCase()}: ${object[perm]},`;
    return r;
  };
  useEffect(() => {
    let endpoint = (window as any).endpoint,
      token = localStorage.token;
    if (selector !== 0x1 || roles !== null || !endpoint || !token) {
      return;
    }
    (async () => {
      setLoader(true);
      const rolesFetched = await axios.request({
        url: `${endpoint}/me/get_roles`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoader(false);
      let result = rolesFetched.data;
      try {
        if (!result || !("status" in result) || result.status !== true || !("roles" in result)) {
          throw new Error("error");
        }
        dispatch({
          type: "UPDATE_ADMIN_STATE",
          payload: {
            roles: result.roles,
          },
        });
      } catch (e) {
        setAlert({ type: "error", msg: "message" in result ? result.message : "❌ Failed, Something went wrong" });
      }
    })();
  }, [selector, roles]);

  if (selector !== 0x1) return null;
  let rolesArray = roles ? Object.keys(roles) : [];
  return loading ? (
    <div className="loader-small" />
  ) : (
    (roles && (
      <RoleManageComponent disabled={selector !== 0x1}>
        <Alert state={alertSeconder}>{alertSeconder && alertSeconder.msg}</Alert>
        <div className="form">
          <div className="label">ROLES</div>
          <div className="roles">
            {rolesArray.length > 0 ? (
              rolesArray.map((role, i) => (
                <div className="role" key={i} title={tranformPermissionObjectToTitle(roles[role].permission)}>
                  <span className="role-name" style={"color" in roles[role] ? { color: roles[role].color } : {}}>
                    {role}
                  </span>
                  <div className="button-remove-role" onClick={() => removeRole(role)}>
                    <i className="fal fa-times" />
                  </div>
                </div>
              ))
            ) : (
              <div className="label">there's no roles yet</div>
            )}
          </div>
          <div className="label">GIVE A ROLE</div>
          <div className="form">
            <div className="label">PID</div>
            <input type="text" placeholder="id player" onChange={(e) => (inputs["pid"] = e.target.value)} />
            <div className="label">SELECT ROLE</div>
            <select onChange={(e) => (inputs["role"] = e.target.value)}>
              {rolesArray.length > 0 &&
                rolesArray.map((role, i) => (
                  <option value={role} key={i}>
                    {role}
                  </option>
                ))}
            </select>
            <div
              className="button-creation"
              style={buttonLoading ? { cursor: "not-allowed" } : {}}
              onClick={() => !buttonLoading && giveRole()}
            >
              {!buttonLoading ? "GIVE" : <div className="loader-button"></div>}
            </div>
          </div>
        </div>
      </RoleManageComponent>
    )) ||
      null
  );
};
