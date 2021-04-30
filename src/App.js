import { useRef, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { CirclePicker } from "react-color";
import { useState } from "react";
import { HotKeys } from "react-hotkeys";
import { io } from "socket.io-client";

import width4 from "./images/width-4.png";
import width20 from "./images/width-20.png";
import width40 from "./images/width-40.png";
import SetUsername from "./components/SetUsername";
import UserList from "./components/UserList";
import Countdown from "./components/Countdown";

const keyMap = {
  UNDO: "ctrl+z",
  REDO: "ctrl+y",
};

const colors = [
  "#fff",
  "#000",
  "#FF0000",
  "#008000",
  "#FFFF00",
  "#0000FF",
  "#773704",
];

function App() {
  const [selectedColor, setSelectedColor] = useState("#000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const sketchRef = useRef();
  const focusRef = useRef();

  const [socket, setSocket] = useState();

  const [paths, setPaths] = useState();

  const [isDrawing, setIsDrawing] = useState(false);

  const [username, setUsername] = useState("");
  const [userList, setUserList] = useState([]);

  const [hasGuessedWord, setHasGuessedWord] = useState(false);

  const styles = {
    border: "0.0625rem solid #9c9c9c",
    borderRadius: "0.25rem",
    height: window.innerWidth > 650 ? "600px" : `${window.innerWidth * 0.9}px`,
    width: window.innerWidth > 650 ? "600px" : `${window.innerWidth * 0.9}px`,
  };

  const [word, setWord] = useState("");
  const [guess, setGuess] = useState("");
  const [playerGuesses, setPlayerGuesses] = useState([]);

  const [isRunning, setIsRunning] = useState(false);

  const [time, setTime] = useState(60);

  useEffect(() => {
    if (username === "") return;
    var connectionOptions = {
      "force new connection": true,
      reconnectionAttempts: "Infinity",
      timeout: 10000,
      transports: ["websocket"],
    };
    const s = io("https://sketchr-io.herokuapp.com/", connectionOptions);
    setSocket(s);

    s.emit("username", username);

    return () => {
      s.disconnect();
      setIsDrawing(false);
    };
  }, [username]);

  const handlers = {
    UNDO: async (event) => {
      if (!isDrawing) return;
      sketchRef.current.undo();
      sendPaths("undo");
    },
    REDO: async (event) => {
      if (!isDrawing) return;
      sketchRef.current.redo();
      sendPaths("redo");
    },
  };

  const sendPaths = (paths) => {
    console.log(paths);
    socket.emit("update-paths", paths, window.innerWidth);
    console.log(window.innerWidth);
  };

  useEffect(() => {
    if (socket == null) return;
    socket.on("update-paths", (path, screenWidth) => {
      if (path.length === 0) {
        sketchRef.current.clearCanvas();
        return null;
      }

      if (path === "undo") {
        sketchRef.current.undo();
        return;
      }
      if (path === "redo") {
        sketchRef.current.redo();
        return;
      }
      //convert the path for smaller screens
      let newPaths = [];
      for (let i = 0; i < path.length; i++) {
        newPaths[i] = path[i].paths.map((item) => {
          if (window.innerWidth < 650 && screenWidth > 650) {
            item.x /= 600 / (window.innerWidth * 0.9);
            item.y /= 600 / (window.innerWidth * 0.9);
          } else if (screenWidth < 650) {
            item.x *= 600 / (screenWidth * 0.9);
            item.y *= 600 / (screenWidth * 0.9);
          }
          return item;
        });
      }
      sketchRef.current.loadPaths(path);
    });

    socket.on("user-list", (users) => {
      setUserList(
        users.map((user) => {
          return {
            username: user.username,
            hasGuessed: user.hasGuessed,
          };
        })
      );
    });

    socket.on("assign-role", (role) => {
      if (role === "drawing") setIsDrawing(true);
      console.log(role);
    });

    socket.on("word", (word) => {
      console.log(word);
      setWord(word);
    });

    socket.on("word-guess", (otherUsername, guess, hasGuessed) => {
      setPlayerGuesses((prevState) => [
        ...prevState,
        {
          otherUsername,
          guess,
        },
      ]);
      if (otherUsername === username) {
        setHasGuessedWord(hasGuessed);
      }
      focusRef.current.scrollIntoView({ behavior: "smooth" });
    });

    socket.on("start-timer", () => {
      setIsRunning(true);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    if (playerGuesses.length === 0) return;
    const otherUsers = userList.filter((user) => user.username !== username);
    console.log(otherUsers);
    if (otherUsers.every((user) => user.hasGuessed)) {
      alert("binbin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerGuesses]);

  useEffect(() => {
    if (paths == null) return;
    //sketchRef.current.loadPahs(paths);
  }, [paths]);

  useEffect(() => {
    if (time === 0) {
      setIsRunning(false);
      alert("timeout");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  const handleGuess = (guess) => {
    if (guess.toString().toLowerCase() === word) {
      setHasGuessedWord(true);
      socket.emit("word-guess", username, guess.toString().toLowerCase(), true);
    } else {
      socket.emit(
        "word-guess",
        username,
        guess.toString().toLowerCase(),
        hasGuessedWord
      );
    }
  };

  const startTimer = () => {
    socket.emit("start-timer");
  };
  //PUT in a start button for person drawing then start timer, add sound if time is less than 10
  //show amount of letters and maybe letter hints every 20 seconds or
  //start thinking about random word choicing, morning gorgeous
  return (
    <>
      {username === "" && <SetUsername setUsername={setUsername} />}
      <div
        className="flex flex-col items-center"
        style={{ backgroundColor: "#0b0e11" }}
      >
        {isDrawing && <h1 className="text-white">{word}</h1>}
        <div className="flex justify-center items-center">
          <Countdown
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            time={time}
            setTime={setTime}
          />
          <button
            className="bg-white text-black px-4 py-1 rounded-sm ml-3"
            onClick={() => startTimer()}
          >
            Start
          </button>
        </div>
        <div className="h-screen flex justify-center items-center">
          <HotKeys
            keyMap={keyMap}
            handlers={handlers}
            className="flex flex-col sm:flex-row justify-center items-center"
          >
            <UserList username={username} users={userList} />
            <div onMouseUp={() => isDrawing && sendPaths(paths)}>
              <div
                className={
                  !isDrawing ? "flex flex-col justify-center items-center" : ""
                }
              >
                <ReactSketchCanvas
                  ref={sketchRef}
                  style={styles}
                  onUpdate={(updatedPaths) =>
                    isDrawing && setPaths(updatedPaths)
                  }
                  strokeWidth={isDrawing ? strokeWidth : 0}
                  strokeColor={isDrawing ? selectedColor : "#fff"}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between items-stretch ml-3 h-full">
              {isDrawing && (
                <>
                  <CirclePicker
                    colors={colors}
                    className="self-start"
                    onChangeComplete={({ hex }) => setSelectedColor(hex)}
                  />
                  <div className=" flex justify-between items-center mt-4">
                    <div
                      onClick={() => setStrokeWidth(4)}
                      className="h-14 w-14 mr-3 p-2 bg-white flex justify-center items-center"
                    >
                      <img src={width4} alt="stroke width 4" />
                    </div>
                    <div
                      onClick={() => setStrokeWidth(20)}
                      className="h-14 w-14 mx-3 p-2 bg-white flex justify-center items-center"
                    >
                      <img className="" src={width20} alt="stroke width 20" />
                    </div>
                    <div
                      onClick={() => setStrokeWidth(40)}
                      className="h-14 w-14 mx-3 p-2 bg-white flex justify-center items-center"
                    >
                      <img className="" src={width40} alt="stroke width 40" />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sketchRef.current.clearCanvas();
                      setPaths([]);
                      sendPaths([]);
                    }}
                    className="px-4 py-3 mt-3 self-start bg-blue-600 text-white text-lg"
                  >
                    Clear all
                  </button>
                </>
              )}
              <div className="flex flex-col justify-start items-center mt-4 w-full">
                <div className="border border-gray-400 h-80 w-full text-white overflow-y-scroll">
                  {playerGuesses.map(({ otherUsername, guess }) => (
                    <div className="ml-2 my-1 flex flex-col">
                      {!hasGuessedWord ? (
                        <div className="flex">
                          <p className="font-semibold mr-2">{otherUsername}:</p>
                          <p>{guess}</p>
                        </div>
                      ) : (
                        <div className="flex">
                          <p className="font-semibold mr-2 text-green-600">
                            {otherUsername}:
                          </p>
                          <p className="text-green-600">{guess}</p>
                        </div>
                      )}
                      {guess === word && (
                        <p className="text-green-600">
                          {otherUsername} guessed the word!
                        </p>
                      )}
                    </div>
                  ))}
                  <div ref={focusRef}></div>
                </div>
                {!isDrawing && (
                  <form onSubmit={(e) => e.preventDefault()} className="mt-2">
                    <input
                      type="text"
                      name="guess"
                      value={guess}
                      onChange={(e) => {
                        setGuess(e.target.value);
                      }}
                      className="h-10"
                    />
                    <button
                      onClick={() => {
                        handleGuess(guess);
                        setGuess("");
                      }}
                      type="submit"
                      className="bg-white text-black ml-2 px-4 py-2"
                    >
                      Guess
                    </button>
                  </form>
                )}
              </div>
            </div>
          </HotKeys>
        </div>
      </div>
    </>
  );
}

export default App;
