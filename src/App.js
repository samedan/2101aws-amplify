import React, { Component } from "react";
import { API, Auth, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import { onCreateNote } from "./graphql/subscriptions";
import { withAuthenticator } from "aws-amplify-react";

class App extends Component {
  state = {
    id: "",
    note: "",
    notes: [],
  };

  componentDidMount() {
    this.getNotes();
    API.graphql(
      graphqlOperation(onCreateNote, {
        owner: Auth.currentUserInfo().username,
      })
    ).subscribe({
      next: (noteData) => {
        console.log(noteData);
      },
    });
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  };

  handleChangeNote = (event) => {
    this.setState({ note: event.target.value });
  };

  // checks to see if a Note is New or Old
  hasExistingNote = () => {
    const { notes, id } = this.state;
    if (id) {
      //check if is a valid 'id', returns Boolean
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  // mutation {
  //   createNote(input: {
  //     note: "Hello Amplify"
  //   }) {
  //     id
  //   }
  // }
  handleAddNote = async (event) => {
    event.preventDefault();
    // check if there is a existing note in the state (clicked in the list), if so update it
    if (this.hasExistingNote()) {
      // console.log("Note Updated");
      this.handleUpdateNote();
    } else {
      const { note, notes } = this.state;
      const input = { note };
      const result = await API.graphql(graphqlOperation(createNote, { input }));
      const newNote = result.data.createNote;
      const updatedNotes = [newNote, ...notes];
      this.setState({ notes: updatedNotes, note: "" });
    }
  };

  handleUpdateNote = async () => {
    const { notes, id, note } = this.state;
    const input = { id, note };
    const result = await API.graphql(graphqlOperation(updateNote, { input }));
    const updatedNote = result.data.updateNote;
    // put the updated Note in the right place in the list
    const index = notes.findIndex((note) => note.id === updatedNote.id);
    const updatedNotes = [
      // [ notes until the IndexNote ...]
      ...notes.slice(0, index),
      // [ ... ,IndexNote, ...]
      updatedNote,
      // [ ...notes After the IndexNote]
      ...notes.slice(index + 1),
    ];
    this.setState({ notes: updatedNotes, note: "", id: "" });
  };

  handleDeleteNote = async (noteId) => {
    const { notes } = this.state;
    const input = { id: noteId };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const deleteNoteId = result.data.deleteNote.id;
    const updatedNotes = notes.filter((note) => note.id !== deleteNoteId);
    this.setState({ notes: updatedNotes });
  };

  handleSetNote = ({ note, id }) => this.setState({ note, id });

  render() {
    const { notes, note, id } = this.state;
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-1">Amplify Notetaker</h1>
        <form onSubmit={this.handleAddNote} className="mb3">
          <input
            onChange={this.handleChangeNote}
            type="text"
            className="pa2 f4"
            placeholder="Write your note"
            value={note}
          />
          <button className="pa2 f4" type="submit">
            {id ? "Update note" : "Add Note"}
          </button>
        </form>

        {/* Notes list */}
        {notes.map((item) => (
          <div key={item.id} className="flex items-center">
            <li
              className="list pa1 f3"
              onClick={() => this.handleSetNote(item)}
            >
              {item.note}
            </li>
            <button
              onClick={() => this.handleDeleteNote(item.id)}
              className="bg-transparent bn f4"
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
