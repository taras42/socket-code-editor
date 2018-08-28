var APP = {};

(function(APP) {

	function initEditor(socket, editorTextArea, roomId, state) {
		function onEditorChange(editor, options) {
			socket.emit("edit", {
				content: editor.getValue(),
				selections: editor.listSelections()
			}, roomId);
    	}

    	function setEditorContentState(editor, state) {
    		editor.setValue(state.content);
            state.selections && editor.setSelections(state.selections);
    	}

		var editor = CodeMirror.fromTextArea(editorTextArea, {
            lineNumbers: true,
            lineWrapping: true,
            mode: state.mode
        });

        editor.setSize("100%", "100%");
        setEditorContentState(editor, state);

        editor.on("cursorActivity", onEditorChange);

        socket.on("updateEditor", function(state) {
            editor.off("cursorActivity", onEditorChange);
            setEditorContentState(editor, state);
            editor.on("cursorActivity", onEditorChange);
        });

        return editor;
	};

	function initLenguageSelect(lenguageSelect, socket, editor, mode) {
		lenguageSelect.val(mode);

		lenguageSelect.on("change", function() {
            socket.emit("modeChange", lenguageSelect.val());
        });

        socket.on("modeChanged", function(mode) {
        	lenguageSelect.val(mode);
        	editor.setOption("mode", mode);
        });
	};

	function initCopyRoomLinkButton(copyRoomLinkButton, copyLocationInput, roomLocation) {
		copyRoomLinkButton.on("click", function() {
            copyLocationInput.val(roomLocation);

            copyLocationInput[0].select();

            document.execCommand("copy");
        });
	};

	function initUsersList(users, socket, usersList) {
		rerenderList(usersList, users);

		socket.on("newUserJoined", function(users) {
			rerenderList(usersList, users);
        });

        socket.on("userDisconnected", function(users) {
			rerenderList(usersList, users);
        });
	};

	function rerenderList(usersList, users) {
		usersList.empty();

    	var html = users.reduce(function(memo, userName) {
			memo += getUserListElement(userName);

			return memo;
		}, "");

		usersList.append(html);
	}

	function getUserListElement(userName) {
		return "<li class='list-group-item' data-name='" + userName + "'" + ">" + userName + "</li>";
	};

	APP.init = function(options) {
		var socket = options.socket,
			roomId = options.roomId,
			roomLocation = options.roomLocation,
			name = options.name,
			editorTextArea = options.editorTextArea,
			lenguageSelect = options.lenguageSelect,
			copyRoomLinkButton = options.copyRoomLinkButton,
			copyLocationInput = options.copyLocationInput,
			usersList = options.usersList;

		socket.emit('room', roomId, name);

		socket.on('userInit', function(users, editorOptions) {
			var editor = initEditor(socket, editorTextArea, roomId, editorOptions);

			initLenguageSelect(lenguageSelect, socket, editor, editorOptions.mode);
			initCopyRoomLinkButton(copyRoomLinkButton, copyLocationInput, roomLocation);
			initUsersList(users, socket, usersList);
		});
	}
})(APP);