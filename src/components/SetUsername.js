import { useState, useRef, useEffect } from "react";

const SetUsername = ({ setUsername }) => {
  const [usernameInput, setUsernameInput] = useState("");

  const focusRef = useRef();

  useEffect(() => {
    focusRef.current.focus();
  }, []);

  return (
    <div className="z-10 absolute top-0 left-0 h-full w-full bg-black bg-opacity-70 flex justify-center items-center">
      <div className=" text-black flex justify-center items-center">
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            ref={focusRef}
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            name="username"
          />
          <button
            type="submit"
            onClick={() => setUsername(usernameInput)}
            className="px-4 py-1 bg-white ml-2 text-black"
          >
            Set
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetUsername;
