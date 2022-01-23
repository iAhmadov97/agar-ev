import axios from "axios";
import React, { FC, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { ClanState } from "../../../redux/reducers/general/clanReducer";
import { overlayState } from "../../../redux/reducers/general/overly";
import { Dispatch, StateInterface } from "../../../redux/reduxIndex";
import { imageObjectContentCss } from "../../middlewares/ModeTeams";
import { parseTimeStamp } from "../actions";

const UsersClan = styled.div``;

export const ClanUsers: FC<{ isValid: boolean }> = ({ isValid }) => {
  const { clan } = useSelector<StateInterface, ClanState>((state) => state.clan);
  const { account } = useSelector<StateInterface, overlayState>((state) => state.overaly);
  const dispatch = useDispatch<Dispatch<ClanState>>();

  var [buttunLoading, setButtonLoading] = useState<string | null>(null);
  var [selectorDrop, setselectorDrop] = useState<number>(0x0);

  const UnDropDownContent = (event: any) => {
    if (
      !event.target.matches(".drop-down-button") &&
      !event.target.matches(".drop-down-button i") &&
      !event.target.matches(".selector-drop .button")
    ) {
      setselectorDrop(0x0);
    }
  };

  const sendRequestManage = async (type: number, targetUserpid: string) => {
    let token = localStorage.token ?? null,
      endpoint = (window as any).env.ENDPOINT;
    if (!token || !endpoint || !targetUserpid || typeof type !== "number") return;
    setButtonLoading(`${type}${targetUserpid}`);
    const managed = await axios.request({
      url: `${endpoint}/me/manage_users_clan`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        type: type,
        target: targetUserpid,
      }),
    });
    setButtonLoading(null);
    if (managed) {
      let result = managed.data;
      if ("status" in result && result.status === true && clan) {
        interface ObjectUser {
          admin?: boolean;
          banned?: boolean;
          verified?: boolean;
        }
        let objectUpdated: ObjectUser = {};
        if (type === 0x0 || type === 0x1) objectUpdated.banned = type === 0x0;
        else if (type === 0x2 || type === 0x3) objectUpdated.admin = type === 0x2;
        else if (type === 0x4 || type === 0x5) objectUpdated.verified = type === 0x4;
        if (Object.keys(objectUpdated).length !== 0) {
          dispatch({
            type: "UPDATE_CLAN_STATE",
            payload: {
              clan: ((window as any).clan = {
                ...clan,
                users: {
                  ...clan.users,
                  [targetUserpid]: Object.assign(clan.users[targetUserpid], objectUpdated),
                },
              }),
            },
          });
        }
      } else alert(result.message ?? "something went wrong");
    }
  };

  const checkIfLoading = (id: string, type: number) => {
    return buttunLoading === `${type}${id}`;
  };

  return isValid && clan ? (
    <UsersClan>
      <div className="clan-users container-content" onClick={UnDropDownContent}>
        <div className="title-bar">
          <div className="title">أعضاء الكلان</div>
        </div>
        <div className="members">
          {clan.users &&
            Object.keys(clan.users).map(
              (userID, i) =>
                clan.users[userID].admin === true && (
                  <div className="user" key={i}>
                    <div className="left-side">
                      <div
                        className="circle"
                        style={imageObjectContentCss(clan.users[userID].id, clan.users[userID].avatar)}
                      ></div>
                      <div className="name-content">
                        <div className="name">
                          {clan.users[userID].name}{" "}
                          <span className="crown">
                            <i className="fas fa-crown" />
                          </span>
                          {clan.users[userID].verified === true ? (
                            <span className="verified">
                              <i className="fal fa-badge-check" />
                            </span>
                          ) : null}
                        </div>
                        <div className="created">{parseTimeStamp(clan.users[userID].joined)}</div>
                      </div>
                    </div>
                    {!clan.users[userID].owner ? (
                      <div className="right-side">
                        <div onClick={() => setselectorDrop((i + 1) * 0x15)} className="drop-down-button">
                          <i className="fal fa-ellipsis-h-alt" />
                          {selectorDrop === (i + 1) * 0x15 ? (
                            <div className="selector-drop">
                              <div
                                className="button"
                                onClick={() => sendRequestManage(clan.users[userID].verified ? 0x5 : 0x4, userID)}
                              >
                                {checkIfLoading(userID, clan.users[userID].verified ? 0x5 : 0x4) ? (
                                  <div className="loader-button"></div>
                                ) : clan.users[userID].verified ? (
                                  "UNVERIFY"
                                ) : (
                                  "VERIFY"
                                )}
                              </div>
                              <div className="button" onClick={() => sendRequestManage(0x3, userID)}>
                                {checkIfLoading(userID, 0x3) ? <div className="loader-button"></div> : "REMOVE ADMIN"}
                              </div>
                              <div
                                onClick={() => sendRequestManage(clan.users[userID].banned ? 0x1 : 0x0, userID)}
                                className={`button${clan.users[userID].banned ? " banned" : ""}`}
                              >
                                {checkIfLoading(userID, clan.users[userID].banned === true ? 0x1 : 0x0) ? (
                                  <div className="loader-button"></div>
                                ) : clan.users[userID].banned === true ? (
                                  "UNBAN"
                                ) : (
                                  "BAN"
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ),
            )}
          {clan.users &&
            Object.keys(clan.users).map(
              (userID, i) =>
                clan.users[userID].admin !== true && (
                  <div className="user" key={i}>
                    <div className="left-side">
                      <div
                        className="circle"
                        style={imageObjectContentCss(clan.users[userID].id, clan.users[userID].avatar)}
                      ></div>
                      <div className="name-content">
                        <div className="name">
                          {clan.users[userID].name}{" "}
                          {clan.users[userID].verified === true ? (
                            <span className="verified">
                              <i className="fal fa-badge-check" />
                            </span>
                          ) : null}
                        </div>
                        <div className="created">{parseTimeStamp(clan.users[userID].joined)}</div>
                      </div>
                    </div>

                    {account && clan.users[account.pid].admin ? (
                      <div className="right-side">
                        <div onClick={() => setselectorDrop((i + 1) * 0x2)} className="drop-down-button">
                          <i className="fal fa-ellipsis-h-alt" />
                          {selectorDrop === (i + 1) * 0x2 ? (
                            <div className="selector-drop">
                              <div
                                className="button"
                                onClick={() => sendRequestManage(clan.users[userID].verified ? 0x5 : 0x4, userID)}
                              >
                                {checkIfLoading(userID, clan.users[userID].verified ? 0x5 : 0x4) ? (
                                  <div className="loader-button"></div>
                                ) : clan.users[userID].verified ? (
                                  "UNVERIFY"
                                ) : (
                                  "VERIFY"
                                )}
                              </div>
                              <div className="button" onClick={() => sendRequestManage(0x2, userID)}>
                                {checkIfLoading(userID, 0x2) ? <div className="loader-button"></div> : "MAKE ADMIN"}
                              </div>
                              <div
                                onClick={() => sendRequestManage(clan.users[userID].banned ? 0x1 : 0x0, userID)}
                                className={`button${clan.users[userID].banned ? " banned" : ""}`}
                              >
                                {checkIfLoading(userID, clan.users[userID].banned === true ? 0x1 : 0x0) ? (
                                  <div className="loader-button"></div>
                                ) : clan.users[userID].banned === true ? (
                                  "UNBAN"
                                ) : (
                                  "BAN"
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ),
            )}
        </div>
      </div>
    </UsersClan>
  ) : null;
};
