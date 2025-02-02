import fetch from 'node-fetch';
import * as vscode from 'vscode';

import { addPeirceNote, getNotes, deleteFilesNotes, getFileNotes, getNotesDb, saveNotes, Note } from './note-db';

import { setDecorations } from
 './decoration/decoration'

interface APIPosition {
    line: number;
    character: number;
}
interface APICoordinates {
    begin: APIPosition;
    end: APIPosition;
}
export interface PopulateAPIReponse {
    coords : APICoordinates;
    interp: string;
    type: string;
}

export const populate = async (): Promise<void> => {
    if (vscode.window.activeTextEditor) {
        console.log("The open text file:")
        console.log(vscode.window.activeTextEditor.document)
        console.log(vscode.window.activeTextEditor.document.getText())
    }
    let editor = vscode.window.activeTextEditor;
    if (editor === undefined)
        return;
    const fileText = vscode.window.activeTextEditor?.document.getText();
    let notes = getNotes();
    console.log(notes);
    console.log(JSON.stringify(notes));
    console.log(fileText);
    console.log(JSON.stringify(fileText));
    let request = {
        file: fileText,
        notes: notes,
    }
    console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/populate";
    const response = await fetch(apiUrl, login);
    const data : PopulateAPIReponse[] = await response.json();
    console.log(data);
    let notesSummary = JSON.stringify(data); 
    deleteFilesNotes();
    // to fix this, we need to have a well-defined JSON response object
    // and change data : any -> data : well-defined-object[]
    // We don't use Note[] because the JSON returned by the API differs
    data.forEach(element => {
        let range = new vscode.Range(
            new vscode.Position(element.coords.begin.line, element.coords.begin.character), 
            new vscode.Position(element.coords.end.line, element.coords.end.character), 
        );
        // Might be able to clean this up
        // Set the vscode.editor.selection position,
        // and let the prebuilt addNote functions do the rest.
        if (editor)
            addPeirceNote(element.interp, element.type, editor, range);
    });
    setDecorations();
    return;
};

export const check = async (): Promise<void> => {
    if (vscode.window.activeTextEditor) {
        console.log("The open text file:")
        console.log(vscode.window.activeTextEditor.document)
        console.log(vscode.window.activeTextEditor.document.getText())
    }
    let editor = vscode.window.activeTextEditor;
    if (editor === undefined)
        return;
    const fileText = vscode.window.activeTextEditor?.document.getText();
    let notes = getFileNotes();
    console.log(notes);
    console.log(JSON.stringify(notes));
    console.log(fileText);
    console.log(JSON.stringify(fileText));
    let request = {
        file: fileText,
        notes: notes,
        spaces: getNotesDb().coordinate_spaces
    }
    console.log(JSON.stringify(request));
    let login = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
    };
    const apiUrl = "http://0.0.0.0:8080/api/check";
    const response = await fetch(apiUrl, login);
    const data : Note[] = await response.json();
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        notes[i] = data[i];
    }
    let i = 0;
    let all_notes = getNotes();
    for (let j = 0; j < all_notes.length; j++) {
        if (all_notes[j].fileName != notes[i].fileName)
            continue;
        all_notes[j].text = notes[i].text;
        all_notes[j].error = notes[i].error;
        i++;
    }
    saveNotes(all_notes);
    setDecorations();
    return;
};