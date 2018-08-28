var APP = {};

(function(APP, $) {

	APP.userCursors = [];
	APP.documentBody = $("body");
	APP.userId = Date.now();

	function getRandomColor() {
	  var letters = '0123456789ABCDEF';
	  var color = '#';

	  for (var i = 0; i < 6; i++) {
	    color += letters[Math.floor(Math.random() * 16)];
	  }

	  return color;
	}

	function renderUserCursors(users) {
		APP.userCursors.forEach(function(cursorEl) {
			cursorEl.remove();
		});

		APP.userCursors = [];

		var cursors = users.reduce(function(memo, user) {
			var cursor = getUserCursor(user);

			if (cursor) {
				memo.push(cursor);
				APP.documentBody.append(cursor);
			}

			return memo;
		}, []);

		APP.userCursors = cursors;
	}

	function getUserCursor(user) {
		var cursor,
			cursorDot,
			x = user.cursorPos.x,
			y = user.cursorPos.y,
			scaleX,
			scaleY;

		if (user.id !== APP.userId) {
			cursor = $("<div class='userCursor'></div>");
			cursorDot = $("<div class='userCursorDot'></div>");
			cursor.append(cursorDot);
			cursor.append($("<div class='userCursorName'>" + user.name +"</div>"));

			cursorDot.css({
				"backgroundColor": user.colour
			});

			scaleX = window.innerWidth/user.screen.width;
			scaleY = window.innerHeight/user.screen.height;

			cursor.css({
				color: user.colour,
				left: x * scaleX,
				top: y * scaleY
			});
		}

		return cursor;
	}

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

	function initUsersTracking(users, socket, usersList, roomId) {
		var then = Date.now();

		rerenderList(usersList, users);
		renderUserCursors(users);

		socket.on("newUserJoined", function(users) {
			rerenderList(usersList, users);
			renderUserCursors(users);
        });

        socket.on("userDisconnected", function(users) {
			rerenderList(usersList, users);
			renderUserCursors(users);
        });

        socket.on("userCursorUpdated", function(users) {
			renderUserCursors(users);
        });

		document.addEventListener("mousemove", function(event) {
			var now = Date.now();

			if (now - then > 100) {
				socket.emit("updateUserCursor", {
					x: event.x,
					y: event.y,
					screenWidth: window.innerWidth,
					screenHeight: window.innerHeight
				}, roomId);

				then = now;
			}
		});
	};

	function rerenderList(usersList, users) {
		usersList.empty();

    	var html = users.reduce(function(memo, user) {
    		var userName = user.name;

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

		socket.emit('room', roomId, {
			userName: name,
			userColour: getRandomColor(),
			userId: APP.userId,
			userScreen: {
				width: window.innerWidth,
				height: window.innerHeight
			}
		});

		socket.on('userInit', function(users, editorOptions) {
			var editor = initEditor(socket, editorTextArea, roomId, editorOptions);

			initLenguageSelect(lenguageSelect, socket, editor, editorOptions.mode);
			initCopyRoomLinkButton(copyRoomLinkButton, copyLocationInput, roomLocation);
			initUsersTracking(users, socket, usersList, roomId);
		});
	}
})(APP, $);