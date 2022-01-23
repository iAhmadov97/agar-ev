import axios from "axios";
import styled from "styled-components";
import curveImage from "../../assets/clan.png";
import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ClanState } from "../../redux/reducers/general/clanReducer";
import { overlayState } from "../../redux/reducers/general/overly";
import { Dispatch, StateInterface } from "../../redux/reduxIndex";
import { parseTimeStamp } from "../utils/actions";

export const imageObjectContentCss = (id: string, hash: string) => {
  return {
    backgroundImage: `url(${
      hash && hash.toString().match(/^(https?)/g)
        ? hash
        : `https://cdn.discordapp.com/avatars/${id}/${hash}.png?size=512`
    })`,
  };
};

const Teams = styled.div`
  position: relative;
  text-align: center;
  font-family: Cairo, sans-serif;
`;

const CopyButton = styled.div<{copied: boolean}>`
  position: relative;
  text-align: center;
  font-family: Cairo, sans-serif;
  color: ${({copied}) => copied ? "var(--main-success-color)" : "unset"};
`;

var inputJoinCode: string = "";

export const ModeTeams: FC = () => {
  const dispatch = useDispatch<Dispatch<overlayState & ClanState>>();
  const { panel, account, loadingClans } = useSelector<StateInterface, overlayState>((state) => state.overaly);
  const { clan } = useSelector<StateInterface, ClanState>((state) => state.clan);

  var [joinInput, setjoinInput] = useState<boolean>(false);
  var [joinButton, setjoinButton] = useState<boolean>(false);
  var [leaveButton, setleaveButton] = useState<boolean>(false);
  var [copiedButton, setcopiedButton] = useState<boolean>(false);

  var JoinCodeInputRef: HTMLInputElement | null = null;

  const dispatchOveraly = (newData: any) => {
    if (!newData) return;
    dispatch({ type: "UPDATE_OVERALY_STATE", payload: newData });
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

  const clanManager = async (leave?: boolean) => {
    if (leave && !confirm("Are you sure you wanna leave ?")) {
      return;
    }
    let token = localStorage.getItem("token");
    let endpoint = (window as any).env.ENDPOINT;
    if ((!leave && !inputJoinCode.length) || !endpoint || !token) return;
    if (leave) setleaveButton(true);
    else setjoinButton(true);
    const userJoined = await axios.request({
      url: `${endpoint}/me/${leave ? "leave" : "join"}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: leave ? {} : JSON.stringify({ code: inputJoinCode }),
    });
    if (leave) setleaveButton(false);
    else setjoinButton(false);
    if (userJoined) {
      let result = userJoined.data;
      if ("status" in result && result.status === true) {
        dispatch({
          type: !leave ? "UPDATE_OVERALY_STATE" : "UPDATE_CLAN_STATE",
          payload: Object.assign(
            !leave
              ? {
                  loadingClans: false,
                }
              : { clan: null },
          ),
        });
      } else alert(result.message || "something went wrong");
    }
  };

  const copy = () => {
    if (!JoinCodeInputRef) return;
    JoinCodeInputRef.select();
    document.execCommand("copy");
    setcopiedButton(true);
    setTimeout(() => {
      setcopiedButton(false);
    }, 2E3);
  };

  useEffect(() => {
    if (!loadingClans) {
      const setLoader = () => dispatchOveraly({ loadingClans: true });
      const endpoint = (window as any).env.ENDPOINT;
      const token = localStorage.getItem("token");
      if (!token) return setLoader();
      (async () => {
        if (account) {
          try {
            const clanDetails = await axios.request({
              url: `${endpoint}/me/clans`,
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setLoader();
            if (clanDetails) {
              const data = clanDetails.data;
              if ("status" in data && data.status === true) {
                (window as any).clan = data;
                dispatch({
                  type: "UPDATE_CLAN_STATE",
                  payload: {
                    clan: data,
                  },
                });
              }
            }
          } catch (e) {
            setLoader();
          }
        } else setLoader();
      })();
    }
  }, [account, clan, loadingClans]);

  const isAdmin = account && "admin" in account.role && account.role.admin === true ? true : false;
  return (
    <Teams id="teams-container">
      {!loadingClans ? (
        <div className="loader-small" />
      ) : !clan ? (
        <div className="get-started">
          <div className="right-description">
            <div className="title gradient-text">نظام الكلان</div>
            <ul>
              <li>وضع التاق كلان على الخلية</li>
              <li>مميزات اضافية على الشات</li>
              <li>اشياء اضافيه للاعبين</li>
            </ul>
          </div>
          <div className="wrap">
            {!joinInput ? (
              <>
                <div className="buttons">
                  <div
                    className="button"
                    style={!account ? { cursor: "not-allowed" } : {}}
                    onClick={() => account && controllPanel("on", "clanMaker")}
                  >
                    إنشاء
                  </div>
                  <div
                    className="button"
                    style={!account ? { cursor: "not-allowed" } : {}}
                    onClick={() => account && setjoinInput(true)}
                  >
                    إنظمام
                  </div>
                </div>
                <div className="selection  gradient-text">إنشاء عالم اخر</div>
              </>
            ) : (
              <>
                <div className="buttons">
                  <div className="button" onClick={() => setjoinInput(false)}>
                    <i className="fal fa-angle-left" />
                  </div>
                  <div
                    className="button"
                    style={joinButton ? { cursor: "not-allowed" } : {}}
                    onClick={() => !joinButton && clanManager()}
                  >
                    {joinButton ? <div className="loader-button"></div> : "إنظمام"}
                  </div>
                </div>
                <input type="text" placeholder="invite code" onChange={(e) => (inputJoinCode = e.target.value)} />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="clan-details">
          <div className="line" style={{ backgroundImage: `url(${clan.bg})` }}>
            <div className="curve" style={{ backgroundImage: `url(${curveImage})` }}></div>
            <div className="left-side">
              <div className="care-image">
                <div className="circle" style={{ backgroundImage: `url(${clan.skin})` }}></div>
              </div>

              <div className="name-area">
                <div className="tag">{clan.tag}</div>

                <div className="name">{clan.name}</div>
                {clan.verified === true ? (
                  <div className="badge">
                    <i className="fal fa-badge-check" />
                  </div>
                ) : null}
                <div className="line-sider">
                  <div className="created">{parseTimeStamp(clan.createdAt)}</div>
                </div>
              </div>
            </div>

            <div className="right-side">
              {isAdmin ? (
                <div
                  className="settings-clan gradient"
                  onClick={() => account && isAdmin && controllPanel("on", "clanSettings")}
                >
                  <i className="fal fa-cog"></i>
                </div>
              ) : null}
              <div className="leave-clan" onClick={() => account && !leaveButton && clanManager(true)}>
                {leaveButton ? <div className="loader-button"></div> : <i className="fal fa-sign-out-alt"></i>}
              </div>
            </div>
          </div>
          <div className="manage-members-wrapper">
            <div className="clients">
              {clan.users &&
                Object.keys(clan.users)
                  .slice(0, 7)
                  .map((userID: string, i) => (
                    <div
                      className="user"
                      key={i}
                      title={clan.users[userID].username}
                      style={imageObjectContentCss(clan.users[userID].id, clan.users[userID].avatar)}
                    ></div>
                  ))}
            </div>
            <div className="button" onClick={() => controllPanel("on", "users")}>
              {isAdmin ? "Manage" : "Other"}
            </div>
          </div>

          <div className="invite-link">
            <input
              type="text"
              className="input-link"
              ref={(e) => (JoinCodeInputRef = e)}
              defaultValue={clan.joinCode || ""}
              placeholder="Invite code"
            />
            <CopyButton id="copy-button" copied={copiedButton} onClick={() => copy()}>
              {copiedButton ? "copied" : "copy"}
            </CopyButton>
          </div>
        </div>
      )}
    </Teams>
  );
};
