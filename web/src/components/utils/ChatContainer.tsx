import React, { FC, useEffect } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { CommandsHandler } from "../../main/CommandHandler";
import { Writer } from "../../middlewares/binaryPacket";
import { overlayState } from "../../redux/reducers/general/overly";
import { StateInterface } from "../../redux/reduxIndex";

const ChatContainerEle = styled.div<{ account: any }>`
  display: grid;
  grid-template-rows: auto 50px;
  overflow: hidden;
  width: 300px;
  height: auto;
  max-height: 400px;
  position: fixed;
  bottom: 0;
  left: 5px;
  padding: 0;
  border-radius: 3px;
  z-index: 199;
  .content-messages {
    position: relative;
    overflow-y: hidden;
    width: 100%;
    max-height: 300px;
    margin: 0 auto;
    overflow-y: auto;
    .message {
      overflow: hidden;
      width: calc(100% - 20px);
      height: auto;
      margin: 5px;
      padding: 5px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 3px;
      & > div {
        display: inline-block;
      }
      .role,
      .verified,
      .id {
        padding: 3px 5px;
        text-transform: uppercase;
        font-size: 12px;
        border-radius: 3px;
        background: rgba(253, 253, 253, 0.11);
        color: rgb(141, 141, 141);
      }
      .verified {
        color: var(--main-colo);
      }
      .title,
      .id {
        color: #ddd;
      }
      .title {
        font-size: 13px;
        text-transform: uppercase;
        margin: 0 0 0 2px;
      }
      p {
        padding: 5px;
        border-radius: 3px;
        color: rgb(141, 141, 141);
        font-size: 13px;
        margin: 0;
      }
    }
  }

  .bottom-input {
    position: relative;
    width: 100%;
    margin: 0 0 0 5px;
    input {
      ${({ account }) => (account ? "cursor: not-allowed;" : "")}
      width: 270px;
      color: rgb(141, 141, 141);
      height: auto;
      background: rgba(253, 253, 253, 0.068);
      padding: 8px 10px;
      margin: 5px 0;
      border: 0;
      border-radius: 3px;
      outline: none;
      &:hover {
        background: rgba(253, 253, 253, 0.08);
      }
    }
  }
`;

export const sendChatMessage = (message: string) => {
  let wn: any = window, prefix = message.charAt(0);
  if (prefix === "$") {
    CommandsHandler(message);
    return;
  } else if (prefix === "/" || !wn.sendPacket) return;
  let writerChat = new Writer();
  writerChat.setUint8(0x63);
  writerChat.setUint8(0x0);
  writerChat.setStringUTF8(message);
  wn.sendPacket(writerChat, null);
};

export const ChatContainer: FC = () => {
  const { account } = useSelector<StateInterface, overlayState>((state) => state.overaly);
  const isMuted =
    account &&
    "playerDetails" in account &&
    "muted" in account.playerDetails &&
    Object.prototype.hasOwnProperty.call(account.playerDetails.muted, "muted") &&
    account.playerDetails.muted.muted === true
      ? true
      : false;

  useEffect(() => {
    let wn = window as any;
    if (isMuted && wn.sendSystemMessage) {
      wn.sendSystemMessage("لايمكنك كتابة على الشات");
    }
  }, [isMuted]);

  if (account && "banned" in account && account.banned === true) {
    return null;
  }


  const reloadChat = (a: boolean) => {
    let wn: any = window;
    wn.isTyping = a;
    wn.chatDrawer();
  }
  return (
    <ChatContainerEle id="chat-container" account={!account || isMuted}>
      <div className="content-messages"></div>
      <div className="bottom-input">
        <input
          type="text"
          id="chat_textbox"
          onFocus={() => reloadChat(true)}
          onBlur={() => reloadChat(false)}
          placeholder="Press enter to chat"
          maxLength={200}
          title={
            isMuted ? "You can't chat now, You should sign in then try or you need tobe unmuted" : "Entre a message"
          }
          disabled={!account || isMuted ? true : false}
        />
      </div>
    </ChatContainerEle>
  );
};
