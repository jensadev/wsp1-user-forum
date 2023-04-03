# Users + forum

## History

```bash
mkdir wsp1-user-forum
cd wsp1-user-forum
npm init -y
git init
touch .gitignore
git add .
git commit -m "🎉"
git branch -M main
touch app.ks
mkdir bin
```

https://github.com/jensnti/wsp1-login-facit/blob/main/app.js

https://github.com/jensnti/wsp1-login-facit/blob/main/bin/www -> server.js

package.json

```json
    "dev": "nodemon -e js,html,njk .server.js",
```
    
```bash
npm install nodemon --save-dev
npm install express dotenv bcrypt cookie-parser express-session morgan mysql2 nunjucks
```

# Chat

Jag har anpassat exemplet från [socket.io](https://socket.io/get-started/chat) så att det finns i detta repo.

Så ni kan absolut följa allt på socket.io för att komma igång, men jag tänkte att det är bra att visa var saker och ting ska hamna (eftersom vi har en uppdelning av bin/www / server.js och app.js).

## Serving HTML

Skapa en chat route eller använd index, vilket som.
Jag har redigerat och lagt till följande i index.

```html
    <ul id="messages"></ul>
    <form id="form" action="">
      <input id="input" autocomplete="off" /><button>Send</button>
    </form>
```

## Installera socket.io

```bash	
npm install socket.io
```

Sen behöver vi ladda in socket.io i server.js

Lägg in följande kod efter ```createServer(app)```

```js
/**
 * Load Socket.io and do stuff
 */
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
});
```

Nästa steg är att ladda socket.io klienten i din frontend.

Öppna din njk fil och lägg till följande.

```html
<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
</script>
```

Om du nu kör igång allt så ska du se ett ```user connected``` i terminalen när din frontend laddas i webbläsaren.

Du kan nu lägga till kod för att visa ett meddelande när en användare kopplar ifrån.

Redigera tidigare kod i `server.js`

```js
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
```

## Events

Socket.io fungerar så att när något sker (ett event) så skickar den ett meddelande till alla andra användare som är kopplade till samma socket.

Vi kan använda detta för att skicka ett meddelande från en klient och sedan skicka det till alla andra klienter.

Eftersom detta event börjar från klienten så behöver vi lägga till kod i vår frontend. Detta event tas sedan emot av servern och servern skickar sedan vidare det till alla andra klienter.

I din njk fil lägg till följande javascript.

```html
    const form = document.querySelector('#form');
    const input = document.querySelector('#input');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            socket.emit('chat message', input.value);
            input.value = '';
        }
    });
```

Koden börjar med att välja ut vårt formulär och input fält. Sedan lägger vi till en event listener på formuläret som lyssnar på submit. När det händer så hämtar vi värdet från input fältet och skickar det till servern.
Sedan töms input fältet.

Än så länge händer inget på servern, för det så behöver vi lyssna efter eventet `chat message`.

Redigera tidigare kod i `server.js`

```js
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
});
```

Gör ändringarna, om du nu skriver och skickar ett meddelande så ska du se det i terminalen.

## Broadcasting

Så nu skickar vår klient ut meddelanden, servern snappar upp dem, men inget mer sker.

För att skicka vidare meddelandet från servern till alla klienter så behöver vi använda oss av `emit`.
För att skicka vidare meddelandet till alla (inklusive avsändaren)

```js
io.emit('chat message', msg);
```

För att visa meddelandet på alla klienter så behöver vi lyssna efter eventet `chat message` och sedan skriva ut det i vår ul.

```js
const messages = document.querySelector('#messages');

socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});
```

Och med det slutgiltiga tillägget så har vi en chatt som fungerar.

## Homework

Kopierat från socket.io

* Broadcast a message to connected users when someone connects or disconnects.
* Add support for nicknames.
* Don’t send the same message to the user that sent it. Instead, append the message directly as soon as they press enter.
* Add “{user} is typing” functionality.
* Show who’s online.
* Add private messaging.

## Chatrum / kanaler

Det finns en del saker som vi inte har med i vår chatt, som att kunna skapa olika rum eller kanaler.

Jag gjorde något sådant när jag joxade med [amogus](https://github.com/jensnti/amogus) grunkan. Ni hittar det i repot om ni är nyfikna.

Men förenklat så sätter du ett rum när du kopplar upp dig till socketen.

```js
io.on('connection', (socket) => {
    socket.join('room1');
});
```

Och sedan så sker broadcasten till alla användare i det rummet.

```js
io.to('room1').emit('chat message', msg);
```

## GLHF