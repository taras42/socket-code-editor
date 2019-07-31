import io from 'socket.io-client/dist/socket.io';
import App from './app';

import '../styles/index.css';
import 'codemirror/lib/codemirror.css';

const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const editorTextArea = document.getElementById('editor'),
        languageSelect = document.getElementById('language'),
        copyRoomLinkButton = document.getElementById('copyRoomLink'),
        copyLocationInput = document.getElementById('copyLocationInput'),
        usersList = document.getElementById('usersList'),
        autoScroll = document.getElementById('autoScroll');

    const roomLocation = document.location.href,
        roomId = document.location.pathname.split('/').reverse()[0];

    const name = prompt('Enter your name:') || 'User' + Date.now();

    App.init({
        name: name,
        roomId: roomId,
        roomLocation: roomLocation,
        socket: socket,
        usersList: usersList,
        autoScroll: autoScroll,
        editorTextArea: editorTextArea,
        languageSelect: languageSelect,
        copyRoomLinkButton: copyRoomLinkButton,
        copyLocationInput: copyLocationInput
    });
});
