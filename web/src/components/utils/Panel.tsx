import React, { FC, useEffect } from "react";
import styled from "styled-components";
import { overlayState } from "../../redux/reducers/general/overly";
import { Settings } from "../utils/panels/Settings";
import { useSelector, useDispatch } from "react-redux";
import { StateInterface, Dispatch } from "../../redux/reduxIndex";

/* panels */
import { ClanPanel } from "./panels/clan";
import { KeyboardPanel } from "./panels/Keyboard";
import { UploadSkin } from "./panels/UploadSkin";
import { SkinsList } from "./panels/SkinsList";
import { ClanUsers } from "./panels/clanUsers";
import { AdminPanel } from "./panels/AdminPanel";
import { Leaders } from "./panels/Leaders";

/* style generale component */
const PanelElement = styled.div<{ isVasible: boolean }>`
  display: flex;
  position: fixed;
  left: ${({ isVasible }) => (isVasible ? "-400px" : "0")};
  top: 0;
  width: 350px;
  height: 100%;
  z-index: 255;
  background: var(--main-background-force);
  justify-content: left;
  & > div {
    display: ${({ isVasible }) => (isVasible ? "none" : "block")};
    position: relative;
  }
`;

export const Panel: FC<{ endPoint: string; token: string | null }> = ({ endPoint, token }) => {
  const dispatch = useDispatch<Dispatch<overlayState>>();
  const { panel, account } = useSelector<StateInterface, overlayState>((state) => state.overaly);

  (window as any).closePanel = () => {
    dispatch({
      type: "UPDATE_OVERALY_STATE",
      payload: {
        panel: Object.assign({}, panel, { current: null }),
      },
    });
    return false;
  };

  return (
    <PanelElement id="panel-overaly" isVasible={!panel.current}>
      <div className="back-button" onClick={() => (window as any).closePanel()}>
        <span>
          <i className="fal fa-angle-left" />
        </span>
      </div>
      <div className="content">
        {panel.current === "adminpanel" && account && account.role.admin === true ? (
          <AdminPanel endpoint={endPoint || ""} />
        ) : null}
        <UploadSkin
          endpoint={endPoint || ""}
          account={account}
          isValid={panel.current === "uploadskin" && account ? true : false}
        />
        <Settings isValid={panel.current === "settings"} />
        <KeyboardPanel isValid={panel.current === "keyboard"} />
        <ClanPanel
          isValid={panel.current && panel.current?.indexOf("clan") >= 0 ? true : false}
          type={panel.current?.replace("clan", "")}
          endpoint={endPoint || ""}
        />
        <ClanUsers isValid={panel.current === "users"} />
        <SkinsList isValid={panel.current === "skins" ? true : false} account={account} endpoint={endPoint || ""} />
        <Leaders isValid={panel.current === "leaders"} />
      </div>
    </PanelElement>
  );
};
