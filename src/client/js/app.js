import CodeMirror from 'codemirror';
import escapeHTML from 'escape-html';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/htmlmixed/htmlmixed';

import events from '../../isomorfic/events';

const App = {};

App.documentBody = document.body;
App.userId = Date.now();

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
}

function initEditor(socket, editorTextArea, autoScroll, roomId, state) {
    autoScroll.checked = true;

    function onEditorChange(editor, options) {
        socket.emit(events.EDIT, {
            content: editor.getValue(),
            selections: editor.listSelections()
        }, roomId);
    }

    function setEditorContentState(editor, state) {
        const isAutoScroll = autoScroll.checked,
            scrollInfo = editor.getScrollInfo();

        editor.setValue(state.content);

        if (!isAutoScroll) {
            editor.scrollTo(0, scrollInfo.top);
        }

        state.selections && editor.setSelections(state.selections, null, {
            scroll: isAutoScroll
        });
    }

    const editor = CodeMirror.fromTextArea(editorTextArea, {
        lineNumbers: true,
        lineWrapping: true,
        mode: state.mode
    });

    editor.setSize("100%", "100%");
    setEditorContentState(editor, state);

    editor.on("cursorActivity", onEditorChange);

    socket.on(events.UPDATE_EDITOR, function (state) {
        editor.off("cursorActivity", onEditorChange);
        setEditorContentState(editor, state);
        editor.on("cursorActivity", onEditorChange);
    });

    return editor;
};

function initLanguageSelect(languageSelect, socket, editor, mode) {
    languageSelect.value = mode;

    languageSelect.addEventListener("change", function () {
        socket.emit(events.MODE_CHANGE, languageSelect.value);
    });

    socket.on(events.MODE_CHANGED, function (mode) {
        languageSelect.value = mode;
        editor.setOption("mode", mode);
    });
};

function initCopyRoomLinkButton(copyRoomLinkButton, copyLocationInput, roomLocation) {
    copyRoomLinkButton.addEventListener("click", () => {
        copyLocationInput.value = roomLocation;

        copyLocationInput.select();

        document.execCommand("copy");
    });
};

function initUsersTracking(users, socket, usersList, roomId) {
    rerenderList(usersList, users);

    socket.on(events.NEW_USER_JOINED, function (users) {
        rerenderList(usersList, users);
    });

    socket.on(events.USER_DISCONNECTED, function (users) {
        rerenderList(usersList, users);
    });
};

function rerenderList(usersList, users) {
    usersList.innerHTML = '';

    const html = users.reduce(function (memo, user) {
        memo += getUserListElement(user.name, user.colour);

        return memo;
    }, "");

    usersList.innerHTML = html;
}

function getUserListElement(userName, userColour) {
    userName = escapeHTML(userName);

    return `<li class='list-group-item' data-name='${userName}' style='color: ${userColour};'>${userName}</li>`;
};

App.init = function (options) {
    const socket = options.socket,
        roomId = options.roomId,
        roomLocation = options.roomLocation,
        name = options.name,
        editorTextArea = options.editorTextArea,
        languageSelect = options.languageSelect,
        copyRoomLinkButton = options.copyRoomLinkButton,
        copyLocationInput = options.copyLocationInput,
        usersList = options.usersList,
        autoScroll = options.autoScroll;

    socket.emit(events.ROOM, roomId, {
        userName: name,
        userColour: getRandomColor(),
        userId: App.userId
    });

    socket.on(events.USER_INIT, function (users, editorOptions) {
        const editor = initEditor(socket, editorTextArea, autoScroll, roomId, editorOptions);

        initLanguageSelect(languageSelect, socket, editor, editorOptions.mode);
        initCopyRoomLinkButton(copyRoomLinkButton, copyLocationInput, roomLocation);
        initUsersTracking(users, socket, usersList, roomId);
    });
}

export default App;
