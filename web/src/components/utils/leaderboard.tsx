import React, { FC } from "react";
import styled from "styled-components";

const LeaderBoardType = styled.div`
  width: 180px;
  height: 250px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 199;
  .leader-man {
    width: 90%;
    margin: 5px auto 0 auto;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 3px;
    padding: 2px;
    & > div {
      user-select: none;
      display: inline-block;
      width: auto;
      background: rgba(255, 255, 255, 0.05);
      margin: 2px 0 2px 1px;
      padding: 2px 10px;
      font-size: 13px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .name {
      color: #ddd;
      &.isme {
        color: var(--main-color);
      }
    }
    .number {
      background: rgba(255, 255, 255, 0.08);
    }
  }
`;

export const LeaderBoard: FC = () => null/* <LeaderBoardType id="leaderboard-2"></LeaderBoardType>*/;
