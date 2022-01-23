import React, { FC, useState, useEffect } from "react";
import styled from "styled-components";

const GetstartedElement = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999999999999999999999999;
  background: #0008;
  width: 100%;
  height: 100%;
  .panel-get-started {
    width: 400px;
    background: var(--main-background);
    border-radius: 3px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 5px;
    .title-bar {
      margin: 5px;
      .accept-button {
        border: 1px solid #fff1;
        text-transform: uppercase;
        padding: 5px 10px;
        background: #0005;
        font-size: 15px;
        margin: 5px;
        float: right;
        cursor: pointer;
        border-radius: 3px;
      }
      .version {
        color: var(--main-hidden-color);
        font-size: 13px;
        margin: 0 5px;
        text-transform: uppercase;
      }
      .title {
        font-size: 30px;
      }
      .description {
        font-size: 13px;
        color: var(--main-hidden-color);
      }
    }
    .content {
      .version-part {
        max-height: 200px;
        padding: 10px 15px;
        border-radius: 3px;
        background: #0005;
        margin: 5px auto;
        .title-version {
          color: #fff;
          margin: 5px 5px 0 0;
          text-transform: uppercase;
        }
        .version-text {
          font-size: 13px;
        }
        .fixed-text {
          font-size: 15px;
          margin: 5px 10px;
        }
      }
    }
  }
`;
export const PanelGetStarted: FC = () => {
  const wn: any = window;
  const changeLogContent = wn.change_log;
  const [activated, setActivated] = useState<boolean>(false);

  const setActivatedDouble = (version: string) => {
    setActivated(false);
    localStorage.setItem("getstarted_hiden", version);
  };
  
  useEffect(() => {
    let stored = localStorage.getstarted_hiden;
    if (!stored || stored !== (window as any).version_game) {
      if (stored) localStorage.removeItem("getstarted_hiden");
      setActivated(true);
    }
  }, []);

  return activated && changeLogContent ? (
    <GetstartedElement>
      <div className="panel-get-started">
        <div className="title-bar">
          <div className="accept-button" onClick={() => setActivatedDouble(wn.version_game)}>
            Accept
          </div>
          <div className="version">{wn.version_game}</div>
          <div className="title gradient-text">{changeLogContent.title}</div>
          <div className="description">
            If you have problems try update your browser and make sure you have (opera/chrome)
          </div>
        </div>
        <div className="content">
          {Object.keys(changeLogContent).map(
            (version_part, i) =>
              version_part !== "title" && (
                <div key={i} className="version-part">
                  <div className="title-content">
                    <span className="title-version">{changeLogContent[version_part].header}</span>
                    <span className="version-text">{changeLogContent[version_part].version}</span>
                  </div>
                  <div className="fixed">
                    {changeLogContent[version_part].content.map((fixedText: string, i: number) => (
                      <div className="fixed-text" key={i}>
                        {fixedText}
                      </div>
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      </div>
    </GetstartedElement>
  ) : null;
};
