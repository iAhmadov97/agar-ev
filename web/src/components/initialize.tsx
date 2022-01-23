import React, { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoaderScreen } from "../main/loader";
import { StateInterface, Dispatch } from "../redux/reduxIndex";
import { OverlayPlayer } from "./middlewares/overalyPlayer";
import { ChatContainer } from "./utils/ChatContainer";
import { LeaderBoard } from "./utils/leaderboard";

export const Initialize: FC = () => {
  const glState = useSelector<StateInterface, StateInterface>((state) => state);
  (window as any).reduxSelector = glState;
  (window as any).reduxDispatch = useDispatch<Dispatch<StateInterface>>();
  if (!process.env.NODE_ENV) return null; 
  (window as any).env = {
    ENDPOINT: (process.env.NODE_ENV.indexOf("prod") === -1 ? "http://localhost:8088" : "https://api.agar-ev.xyz") + "/v1",
    mode: process.env.NODE_ENV,
  };
  return glState.overaly.loader ? (
    <LoaderScreen />
  ) : (
    <>
      <OverlayPlayer />
      <LeaderBoard />
      <ChatContainer />
    </>
  );
};
