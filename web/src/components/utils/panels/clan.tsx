import React, { FC, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import axios from "axios";
import { overlayState } from "../../../redux/reducers/general/overly";
import { ClanState } from "../../../redux/reducers/general/clanReducer";
import { StateInterface, Dispatch } from "../../../redux/reduxIndex";
import { NumberFormator } from "../NumberFormator";
import { uploadImage } from "../uploadImage";
import { validatorText, validatorURL } from "../validator";
import { GeneraleSetting } from "./clanPanels/generaleSettings";
import { CreationClan } from "./clanPanels/CreateClan";

export type typeAlert = {
  type: string;
  msg: string;
};

const ClanPanelStyle = styled.div`
  text-align: center;
  font-family: Cairo, sans-serif;
`;

export const Alert = styled.div<{ state: typeAlert | null }>`
  display: ${({ state }) => (state === null ? "none" : "block")};
  width: 90%;
  padding: 5px;
  margin: 5px auto;
  border: 1px solid
    ${({ state }) => (state && state.type === "success" ? "var(--main-success-color)" : "var(--main-error-color)")};
  color: ${({ state }) =>
    state && state.type === "success" ? "var(--main-success-color)" : "var(--main-error-color)"};
  text-align: right;
`;

export const ClanPanel: FC<{ isValid: boolean | undefined; type: string | undefined; endpoint: string }> = ({
  endpoint,
  isValid,
  type,
}) => {
  const { account, prixBuyClan } = useSelector<StateInterface, overlayState>((state) => state.overaly);
  const { wrappers, clan } = useSelector<StateInterface, ClanState>((state) => state.clan);

  var [selector, setSelector] = useState<number | null>(null);
  var [selectorPanel, setSelectorPanel] = useState<number>(0);

  const UnDropDownContent = (event: any) => {
    if (!event.target.matches(".selector") && !event.target.matches(".called-selector")) {
      setSelectorPanel(0);
    }
  };

  useEffect(() => {
    setSelector(clan ? 0x0 : 0x1);
  }, [clan]);

  return (
    <>
      {isValid && account && typeof selector === "number" ? (
        <ClanPanelStyle id="teams-container" className="container-content" onClick={UnDropDownContent}>
          <div className="title-bar parts">
            <span className="title left">CLAN</span>
            <div className="selector">
              <div className="called-selector" onClick={() => setSelectorPanel(0x1)}>
                {wrappers && wrappers[selector].replace(/\_/g, " ")} <i className="fal fa-angle-down"></i>
              </div>
              {selectorPanel === 0x1 ? (
                <div className="slc-chouse">
                  {wrappers &&
                    wrappers.map(
                      (type, i) =>
                        i !== selector &&
                        (clan ? type !== "CLAN_CREATION" : type === "CLAN_CREATION") && (
                          <div className="button" key={i} onClick={() => setSelector(i)}>
                            {type.replace(/\_/g, " ")}
                          </div>
                        ),
                    )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="content">
            {clan ? (
              <>
                <GeneraleSetting selector={selector} account={account} clan={clan} />
              </>
            ) : (
              <CreationClan selector={selector} account={account} prix={prixBuyClan} />
            )}
          </div>
        </ClanPanelStyle>
      ) : null}
    </>
  );
};
