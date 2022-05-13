const modal = document.querySelector('#modal')
const formUsername = document.querySelector('#formUsername')

formUsername.addEventListener('submit', (form) => {
    form.preventDefault()
    const formData = new FormData(formUsername)
    const username = formData.get('username')
    makeWebsockets(username)
    modal.close()

})

modal.showModal()



async function makeWebsockets(username) {
    if (username === undefined) {
        return console.error('Username is needed to connect to Websockets')
    }
    const ws = await connectToWebsocket()
    ws.heartbeat()
    ws.send(JSON.stringify({
        type: 'connect',
        username
    }))
    
    ws.onmessage = (messageString) => {        
        const message = JSON.parse(messageString.data)
        console.log(message)
        if (message.type === 'message') {
            addMessage(message.username, message.body, message.color)
        } else if (message.type === 'connect') {
            displayNotification(
                `User ${message.username} has connected`,
                'info'
            )
            addUsernameToList(message.username)
        } else if (message.type === 'disconnect') {
            displayNotification(
                `User ${message.username} has connected`,
                'error'
            )
            handleUsernameRefresh(message.usernames)
        } else if (message.type === 'heartbeat') {
            console.log('received heartbeat')
            ws.heartbeat()
        } else if (message.type === 'usernames') {
            handleUsernameRefresh(message.usernames)
        } else {
            console.error('Unknown message type')
        }
    }

    const chatMessageForm = document.querySelector('#formChatMessage')
    chatMessageForm.addEventListener('submit', (form) => {
        form.preventDefault()

        const data = new FormData(chatMessageForm)
        const chatMessage = {
            type: 'message',
            body: data.get('chatMessage'),
            username
        }
        ws.send(JSON.stringify(chatMessage))

        const textInput = document.querySelector('#inputChatMessage')
        textInput.value = ''
        
    })

    async function connectToWebsocket() {
        const ws =  new WebSocket('ws://localhost:7000/ws')
        ws.heartbeat = heartbeat
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                if (ws.readyState === 1) {
                    clearInterval(timer)
                    resolve(ws)
                }
            }, 10)
        })
    }

    function heartbeat() {
        clearTimeout(this.pingTimeout)
        this.pingTimeout = setTimeout(() => {
            console.error('You have been disconnected')
        }, 1000 * 10 + 2000)
    }

    function addMessage(messageUsername, messageBody, messageColor) {
        if (messageUsername === undefined) {
            return console.error('Username is missing from a message')
        }
        if (messageBody === undefined) {
            return console.error('Body is missing from a message')
        }
        if (messageColor === undefined) {
            return console.error('Color is missing from message')
        }

        const template = document.querySelector('#templateChatMessage')
        const messageBox = document.querySelector('.boxChatMessages')

        const newMessage = template.content.firstElementChild.cloneNode(true)
        const span = document.createElement('span')
        span.textContent= messageUsername
        span.classList.add('bold')
        newMessage.appendChild(span)
        const messageText = document.createTextNode(`: ${messageBody}`)
        newMessage.appendChild(messageText)
        newMessage.style.backgroundColor = `hsl(${messageColor}, 50%, 50%)`
        messageBox.appendChild(newMessage)

    }

    function addUsernameToList(username) {
        if (username === undefined) {
            return console.error('Username must be defined')
        }

        const boxUsernames = document.querySelector('.boxUsernames')
        const newUsername = document.createElement('div')
        newUsername.textContent = username
        boxUsernames.appendChild(newUsername)
    }

    function handleUsernameRefresh(newUsernames) {
        if ((newUsernames instanceof Array) === false) {
            return console.error('newUsernames must be defined')
        }

        const boxUsernames = document.querySelector('.boxUsernames')
        boxUsernames.textContent = ''

        newUsernames.forEach((username) => {
            addUsernameToList(username)
        })
    }


    function displayNotification(text, type, duration = 5000) {
        if (text === undefined) {
            return console.error('Notification must have a text')
        }
        if ((['info', 'error'].includes(type)) === false) {
            return console.error('Type of notification not supported')
        }
        if (duration === undefined) {
            return console.error('Notification must have a durations')
        }

        const notification = document.createElement('div')
        notification.textContent = text

        notification.classList.add('notification')
        notification.classList.add(`notification-${type}`)
        notification.classList.add('show')

        const areaNotifications = document.querySelector('.areaNotifications')
        areaNotifications.appendChild(notification)
        
        setTimeout(() => {
            notification.classList.add('hide')
        }, duration)

    }

}

