import { FC } from "react";
import styled from "styled-components";

const BannedScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main-background-force);
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 999999999999;
  .loader-small {
    width: 30px;
    height: 30px;
  }
  .apolo-text {
    text-align: center;
    .title {
      color: var(--main-color);
      font-size: 30px;
    }
    .message {
      margin: 5px auto;
      font-size: 15px;
      color: #ddd;
    }
  }
`;

export const Banned: FC = () => (
  <BannedScreen>
    <div className="apolo-text">
      <div className="title">Ooops, You look like banned</div>
      <div className="message">You have been banned if you think it as a bug please tell us</div>
    </div>
  </BannedScreen>
);
