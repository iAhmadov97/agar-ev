import React, { FC, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { PanelGetStarted } from "../utils/PanelGetStarted";
import { overlayState } from "../../redux/reducers/general/overly";
import { StateInterface, Dispatch } from "../../redux/reduxIndex";
import { Banned } from "../utils/BannedScreen";
import { Panel } from "../utils/Panel";
import { AccountHandler } from "./accountHandler";
import { ModeTeams } from "./ModeTeams";

const OverlayPlayerEle = styled.div<{ panelActive: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  #account-container-g {
    ${({ panelActive }) => (panelActive ? "" : "margin: 0 0 0 350px !important;")}
  }
`;

export const getCurrentImageCell = (typo = "currentSkin") => {
  let skin = null,
    wn = window as any;
  try {
    if (wn.globalPreference) {
      let target = (typo in wn.globalPreference && wn.globalPreference[typo]) || null;
      if (target && target in wn.loadedSkins) {
        skin = wn.loadedSkins[target].src;
      }
    }
  } catch (e) {
    console.log(e);
  }
  return skin;
};

export const OverlayPlayer: FC = () => {
  var [nickName, setNickName] = useState("");
  var [expanded, setExpand] = useState(false);

  const expandScreen = () => {
    var elem: any = document.documentElement;
    if (!expanded) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }

    setExpand(!expanded);
  };

  const signOut = () => {
    let wn: any = window;
    localStorage.removeItem("token");
    wn.onunload = wn.onbeforeunload = null;
    wn.sendCloseClient();
    location.reload();
  };
  const defaultStorage = () => {
    let objPlayer = {
      name: "",
    };
    try {
      var playerStorage = localStorage.playerDetails;
      if (playerStorage) {
        playerStorage = JSON.parse(playerStorage);
        if (playerStorage && "name" in playerStorage) {
          // double check
          objPlayer.name = playerStorage.name;
        }
      }
    } catch (e) {
      console.log(e);
    }
    return objPlayer;
  };
  const dispatch = useDispatch<Dispatch<overlayState>>();
  const { dropDown, panel, account } = useSelector<StateInterface, overlayState>((state) => state.overaly);

  const dropDownObject = dropDown.content[dropDown.current] || null;

  const dispatchOveraly = (newData: any) => {
    if (!newData) return;
    dispatch({ type: "UPDATE_OVERALY_STATE", payload: newData });
  };

  const UnDropDownContent = (event: any) => {
    if (
      dropDown.currentPanel !== 0 &&
      !event.target.matches(".select-options") &&
      !event.target.matches(".select-options .option")
    ) {
      dropDownButton("panel", 0);
    }
  };
  const getTokenFromStorage = () => {
    var realToken = null,
      tokenFromStorage = localStorage.getItem("token");
    if (tokenFromStorage && tokenFromStorage.match(/^[A-Za-z0-9\.\-\_]+$/g)) {
      realToken = tokenFromStorage;
    }
    return realToken;
  };

  const play = () => {
    let name = !nickName || nickName.length === 0 ? "Stranger" : nickName;
    (window as any).play(name);
  };

  const ENDPOINT = (window as any).env.ENDPOINT;

  const selectServer = (server: string) => {
    if ((window as any).setserver) {
      (window as any).setserver(server);
    }
  };

  useEffect(() => {
    setNickName(defaultStorage().name);
    if (!(window as any).ws) {
      selectServer(dropDown.content[0].server);
    }
  }, []);

  const dropDownButton = (type: string, n: number | string, a?: number) => {
    let objectDropDown = {};
    if (type === "panel" && dropDown.currentPanel !== n) {
      objectDropDown = { currentPanel: n };
    } else if (type === "serverType" && dropDown.current !== n) {
      objectDropDown = { current: n, currentServer: 0, currentPanel: 0 };
    } else if (type === "server") {
      selectServer(n as string);
      objectDropDown = { currentPanel: 0, current: a };
    }
    if (Object.keys(objectDropDown).length > 0) {
      dispatchOveraly({
        dropDown: Object.assign({}, dropDown, objectDropDown),
      });
    }
  };

  const controllPanel = (type = "off", content: string) => {
    let object: any = {};
    if (type === "on" && content) {
      object["current"] = content;
    } else {
      object = { current: null };
    }
    if (Object.keys(object).length !== 0) {
      dispatchOveraly({
        panel: Object.assign({}, panel, object),
      });
    }
  };

  return (
    <OverlayPlayerEle id="overlays" onClick={UnDropDownContent} panelActive={!panel.current}>
      <PanelGetStarted />
      <Panel endPoint={ENDPOINT} token={getTokenFromStorage()} />
      <div id="account-container-g" className="small-container left">
        <AccountHandler endPoint={ENDPOINT} token={getTokenFromStorage()} />
      </div>
      {account && account.banned.banned === true ? (
        <Banned />
      ) : (
        <>
          <div id="player-container" className="small-container middle">
            <div className="player-container">
              <div id="one" className="line">
                <div id="name-input" className="input-form">
                  <input
                    id="name-player"
                    type="text"
                    placeholder="Nickname"
                    defaultValue={nickName || ""}
                    onChange={(e) => setNickName(e.target.value)}
                  />
                </div>
                <div id="select-image" className="select-image" onClick={() => controllPanel("on", "skins")}>
                  <i className="fal fa-images"></i>
                </div>
                <div id="upload" className="select-image" onClick={() => account && controllPanel("on", "uploadskin")}>
                  <i className="fal fa-cloud-upload"></i>
                </div>
              </div>
              <div id="two" className="line">
                <div className="select-type-server select-options" onClick={() => dropDownButton("panel", 1)}>
                  {dropDown.content[dropDown.current].name}
                  <i className="fal fa-angle-down"></i>
                  <div className="panel" style={{ display: dropDown.currentPanel === 1 ? "block" : "none" }}>
                    {dropDown.content.map((typeServers, i) => (
                      <div className="option" key={i} onClick={() => dropDownButton("server", typeServers.server, i)}>
                        {typeServers.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ac-l">
                  <div className="play-button button" onClick={() => play()}>
                    Play
                  </div>
                  <div
                    className="spectate-button"
                    onClick={() => (window as any).spectate && (window as any).spectate()}
                  >
                    <i className="fal fa-eye gradient-text"></i>
                  </div>
                  <div className="card-preview-skin" onClick={() => controllPanel("on", "skins")}>
                    <div className="circle">
                      {getCurrentImageCell() ? <img alt="" src={getCurrentImageCell()} /> : null}
                    </div>
                    <div
                      className="outer-skin"
                      style={{ backgroundImage: `url(${getCurrentImageCell("MEOACIRCLE")})` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="teams-mode-container">
              <ModeTeams />
            </div>
          </div>

          <div id="settings-buttons-container" className="small-container right">
            <div className="button-side" onClick={() => controllPanel("on", "keyboard")}>
              <i className="fal fa-keyboard"></i>
            </div>
            <div className="button-side" onClick={() => controllPanel("on", "settings")}>
              <i className="fal fa-cog"></i>
            </div>
            <div className="button-side" onClick={() => controllPanel("on", "leaders")}>
              <i className="fal fa-crown"></i>
            </div>
            {account && account.role.admin === true ? (
              <div className="button-side" onClick={() => controllPanel("on", "adminpanel")}>
                <i className="fal fa-user-lock"></i>
              </div>
            ) : null}
            <div className="button-side" onClick={() => expandScreen()}>
              {expanded ? <i className="fal fa-compress" /> : <i className="fal fa-expand-wide" />}
            </div>
            <div
              className="button-side"
              style={{ position: "absolute", bottom: "5px", left: "5px" }}
              onClick={() => window.open((window as any).discord)}
            >
              <i className="fab fa-discord"></i>
            </div>
          </div>
        </>
      )}
      <div className="footer">
        <span>{(window as any).version_game}</span>
        {account ? (
          <span className="button" onClick={() => signOut()}>
            SIGN OUT
          </span>
        ) : null}
      </div>
    </OverlayPlayerEle>
  );
};
