import React, { useState, useEffect } from "react";
import { API, Auth, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from "./graphql/subscriptions";
import { withAuthenticator } from "aws-amplify-react";

const App = () => {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getNotes();
    getAuth();

    // POST
    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote, {
        owner: user,
      })
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;
        setNotes((prevNotes) => {
          const oldNotes = prevNotes.filter((note) => note.id !== newNote.id);
          const updatedNotes = [...oldNotes, newNote];
          return updatedNotes;
        });
        setNote("");
      },
    });
    // DELETE
    // const deleteNoteListener = API.graphql(
    //   graphqlOperation(onDeleteNote, {
    //     // owner: Auth.currentAuthenticatedUser().username,
    //     owner: user,
    //   })
    // ).subscribe({
    //   next: (noteData) => {
    //     const deletedNote = noteData.value.data.onDeleteNote;
    //     setNotes((prevNotes) => {
    //       const updatedNotes = prevNotes.filter(
    //         (note) => note.id !== deletedNote.id
    //       );
    //       return updatedNotes;
    //     });
    //   },
    // });
    // UPDATE
    // const updateNoteListener = API.graphql(
    //   graphqlOperation(onUpdateNote, {
    //     // owner: Auth.currentAuthenticatedUser().username,
    //     owner: user,
    //   })
    // ).subscribe({
    //   next: (noteData) => {
    //     const updatedNote = noteData.value.data.onUpdateNote;
    //     setNotes((prevNotes) => {
    //       const index = prevNotes.findIndex(
    //         (note) => note.id === updatedNote.id
    //       );
    //       const updatedNotes = [
    //         // [ notes until the IndexNote ...]
    //         ...notes.slice(0, index),
    //         // [ ... ,IndexNote, ...]
    //         updatedNote,
    //         // [ ...notes After the IndexNote]
    //         ...notes.slice(index + 1),
    //       ];
    //       return updatedNotes;
    //     });
    //     setNote("");
    //     setId("");
    //   },
    // });

    // return () => {
    //   // unsubscribe
    //   createNoteListener.unsubscribe();
    //   deleteNoteListener.unsubscribe();
    //   updateNoteListener.unsubscribe();
    // };
  }, []);

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  };

  const getAuth = () => {
    const user = Auth.currentAuthenticatedUser().username;
    setUser(user);
  };

  const handleChangeNote = (event) => {
    setNote(event.target.value);
  };

  // checks to see if a Note is New or Old
  const hasExistingNote = () => {
    if (id) {
      //check if is a valid 'id', returns Boolean
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    // check if there is a existing note in the state (clicked in the list), if so update it
    if (hasExistingNote()) {
      // console.log("Note Updated");
      handleUpdateNote();
    } else {
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
    }
  };

  const handleUpdateNote = async () => {
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
  };

  const handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
  };

  const handleSetNote = ({ note, id }) => {
    setNote(note);
    setId(id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      <form onSubmit={handleAddNote} className="mb3">
        <input
          onChange={handleChangeNote}
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
          <li className="list pa1 f3" onClick={() => handleSetNote(item)}>
            {item.note}
          </li>
          <button
            onClick={() => handleDeleteNote(item.id)}
            className="bg-transparent bn f4"
          >
            <span>&times;</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default withAuthenticator(App, { includeGreetings: true });
