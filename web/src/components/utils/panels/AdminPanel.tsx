import axios from "axios";
import styled from "styled-components";
import React, { FC, useState } from "react";
import { useSelector } from "react-redux";
import { AdminState } from "../../../redux/reducers/general/admin";
import { StateInterface } from "../../../redux/reduxIndex";

// Components
import { RoleCreation } from "./adminPanels/RoleCreation";
import { RoleManage } from "./adminPanels/RoleManage";
import { ClanStuffs } from "./adminPanels/ClanStuff";
import { SkinsManage } from "./adminPanels/SkinsManage";
import { ChangePropertys } from "./adminPanels/changePropertys";
import { VerifyUsersManage } from "./adminPanels/verificationUsers";

const AdminPanelStyle = styled.div`
  height: 100%;
`;

export const AdminPanel: FC<{ endpoint: string }> = ({ endpoint }) => {
  const { roles, wrappers } = useSelector<StateInterface, AdminState>((state) => state.admin);

  var [selector, setSelector] = useState<number>(0);
  var [selectorPanel, setSelectorPanel] = useState<number>(0);

  const UnDropDownContent = (event: any) => {
    if (!event.target.matches(".selector") && !event.target.matches(".called-selector")) {
      setSelectorPanel(0);
    }
  };

  (window as any).endpoint = endpoint;

  return (
    <AdminPanelStyle onClick={UnDropDownContent} className="container-content">
      <div className="title-bar parts">
        <span className="title left">ADMIN</span>
        <div className="selector">
          <div className="called-selector" onClick={() => setSelectorPanel(0x1)}>
            {wrappers && wrappers[selector].replace(/\_/g, " ")} <i className="fal fa-angle-down"></i>
          </div>
          {selectorPanel === 0x1 ? (
            <div className="slc-chouse">
              {wrappers &&
                wrappers.map(
                  (type, i) =>
                    i !== selector && (
                      <div className="button" key={i} onClick={() => setSelector(i)}>
                        {type.replace(/\_/g, " ")}
                      </div>
                    ),
                )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="conetnt">
        <RoleCreation selector={selector} />
        <RoleManage selector={selector} />
        <ClanStuffs selector={selector} />
        <SkinsManage selector={selector} />
        <ChangePropertys selector={selector} />
        <VerifyUsersManage selector={selector} />
      </div>
    </AdminPanelStyle>
  );
};
