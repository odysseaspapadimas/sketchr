const UserList = ({ myUsername, users }) => {
  console.log(myUsername, users);
  return (
    <div className="self-start flex flex-col mr-3 border border-white text-white w-40 ">
      {users.map(({ username }) => (
        <p key={username}>
          {username}
          {username === myUsername && " (You)"}
        </p>
      ))}
    </div>
  );
};

export default UserList;
