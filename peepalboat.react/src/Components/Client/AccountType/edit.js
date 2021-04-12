import React, { Component } from "react";
import { getDataById } from "../../Services/accountTypeService";

const EditForm = ({ match, history }) => {
  //state = { movie: getMovie() };
  return (
    <div>
      <h1>Edit Form</h1>
      <div>{match.params.id}</div>
      <button
        className="btn btn-primary"
        onClick={() => history.push("/movies")}
      >
        Cancel
      </button>
    </div>
  );
};

export default MovieForm;
