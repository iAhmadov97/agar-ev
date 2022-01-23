import axios from "axios";
import styled from "styled-components";
import React, { FC, useEffect } from "react";
import noAccountImage from "../../assets/account.png";
import { useDispatch, useSelector } from "react-redux";
import { overlayState } from "../../redux/reducers/general/overly";
import { StateInterface, Dispatch } from "../../redux/reduxIndex";
import { WsHandler } from "../../middlewares/wsHandler";
import { NumberFormator } from "../utils/NumberFormator";
import { imageObjectContentCss } from "./ModeTeams";
import { parseTimeStamp } from "../utils/actions";

const AccountContainer = styled.div`
  margin: 0;
  padding: 0;
`;

export const AccountHandler: FC<{ endPoint: string; token: string | null }> = ({ endPoint, token }) => {
  var wsURL: RegExpExecArray | null = null;
  const { account } = useSelector<StateInterface, overlayState>((state) => state.overaly);
  // const dispatch = useDispatch<Dispatch<overlayState>>();

  useEffect(() => {
    let wn: any = window;
    if (wn.pushIntoSkinsLoaded) {
      wn.pushIntoSkinsLoaded(wn.globalPreference.currentSkin);
    }
    if (account && !wn.wsServer) {
      let url: string = endPoint.replace(/(^(https?)\:\/\/|\/.*)/g, "");
      let webSocketServer = url ? new WsHandler(url) : null;
      wn.wsServer = webSocketServer;
      if (webSocketServer) {
        webSocketServer.wsInit(account);
      }
    }
    let canvas = (document as any).getElementsByTagName("canvas");
    if ("0" in canvas && account && account.banned.banned === true) {
      canvas[0].style.display = "none";
    }
  }, [account]);

  const role = account ? ("called" in account.role ? account.role.called : account.role.name) : null;
  const countWidthParcent = (account ? ~~((account.xp.currentXP / account.xp.totalXP) * 100) : 0) + "%";

  const authenticate = () => {
    let wn: any = window;
    wn.onunload = wn.onbeforeunload = null;
    wn.location.href = `${endPoint}/auth/discord`;
  };
  return !account ? (
    <div className="login-container">
      <div className="content-be">
        <img src={noAccountImage} alt="" />
        <div className="title">تسجيل الدخول</div>
        <div className="message">
          للإستفادة من المزايا مثل كتابة على الشات وتطوير حسابك وكسب نقاط للشراء مميزات اخرى
        </div>
        <div className="button" onClick={() => authenticate()}>
          تسجيل دخول عبر ديسكورد
        </div>
      </div>
    </div>
  ) : account && account.banned.banned === true ? null : (
    <AccountContainer id="account-container">
      <div className="content-be">
        <div className="line">
          <div className="care">
            <div className="circle" style={imageObjectContentCss(account.id, account.avatar)}></div>
          </div>
          <div className="left-o">
            <div className="part-1">
              <div className="name" title={account.username}>
                <span className="gradient-text">
                  {account.username.slice(0, 8) + (account.username.length > 8 ? ".." : "")}
                </span>
              </div>
              {account.verified === true ? (
                <div className="badge">
                  <i className="fal fa-badge-check" />
                </div>
              ) : null}
            </div>
            <div className="n-info">
              <div className="pid">#{account.pid}</div>
              <div className="created">{parseTimeStamp(account.createdAt)}</div>
            </div>
          </div>
        </div>

        <div className="info-effect">
          <div className="form">
            <div className="title">ROLE</div>
            <div className="answer">{role}</div>
          </div>
          <div className="form">
            <div className="title">POINTS</div>
            <div className="answer">{NumberFormator(account.balance)}</div>
          </div>
          <div className="form">
            <div className="title">LEVEL</div>
            <div className="answer">{NumberFormator(account.level)}</div>
          </div>
        </div>
        <div className="level-system">
          <div className="line-of-part">
            <span className="left">
              <div className="xp-text">
                <span className="gradient-text">{NumberFormator(account.xp.currentXP)} XP</span>
              </div>
            </span>
            <span className="right">
              <div className="total-xp-text">
                <span className="gradient-text">{NumberFormator(account.xp.totalXP)} XPL</span>
              </div>
            </span>
          </div>
          <div className="progress" title={countWidthParcent}>
            <div title={countWidthParcent} style={{ width: countWidthParcent }}></div>
          </div>
        </div>
      </div>
      {(window as any).ad ? (
        <div className="content-be ads">
          <div
            className="content-ads"
            title={(window as any).ad.title}
            style={{ backgroundImage: `url(${(window as any).ad.image})` }}
            onClick={() => (window.location.href = (window as any).ad.url)}
          ></div>
        </div>
      ) : null}
    </AccountContainer>
  );
};
