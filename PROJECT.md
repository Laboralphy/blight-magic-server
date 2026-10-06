# Blight Magic Project

This project is a websocket multiplayer server.

## Architecture

This is full typescript / node.js ; vitest for unit testing ; eslint, prettier for code quality.
The web server is based on Koa.js and WS for the websocket part.

Priority must be given to a traditional programming style (java like) with classes and design pattern. One classe per files, and interfaces.

## Primary features

### multiprocess

The server will host several games which are independant. Server will dynamically create children processes, each process host a game with it's own rules. A client may choose a game, thus being connected to the corresponding process.

We must analyze the feasability of this multiprocess models before doing anything else.

The games are FPS (wolfenstein type) with position synchronization, client prediction algorithm. They will use @laboralphy/raycaster386 npm package - simulation system to monitor games and ensure client are not cheating level geometry.

### chat system

One of the first features to implement is a chat system (using @laboralphy/o876-txat). The chat system is hosted by the main process only. However any client connected to any Children process may communicate, a set of inter process events must be designed.

## back-end

The back end is Koa.js

What I'm pondering now is if I reuse the ../plasmud-server system of dependency with the Clean Architecture paradigm... I'm a bit skeptics... This is a very cognitive-demanding system. But a nice one in term of interchangeability.
The DI (powered by Awilix) system would allow me to import the persistance system I made in ../plasmud-server (using my own database management system json-db but isn't it overkill ? I would use advise here.

The clean architecture would help me having a central "use-cases" management system. Again analyse ../plasmud-server/packages/server/ there is a home-made clean architecture.

I also think of having a monorepo with packages like in ../plasmud-server (you should analyze ths project) we should have packages like "server" "games" "chat" "client"

There is a clean architexture project template at ../clean-architecture that can be used as a base template.
The clean architecture can be either in its own package, or in server package.

The clean archi part is used for persistance management, chat management, api...  


## front-end

The web front-end would be vue.js with a proper pinia store.

## First proof of concept

When connecting, the client is invited to identify by its login name. The system is minimalistic for now.
The front-end will deliver a minimalistic login page.

the chat system comes with a minimalist command line interpreter (command starts with "/"). There are several admin command that will help control the server. For the proff of concept (POC) all user may use these command.

### Admin command

- /create {type} {name} - create a new game : spawn a new child process, and connect the client in. The process is managed by a class in a package "games". The {type} is a small string that is not currently used, the name is a tag name
- /list - gives a list of created games with their game_id, name, and type
- /join {game_id} - join an existing game : the client connexion is redirected by the proper, eventually quit the previous game.
- /leave - leave the current game. The client disconnects its self from the child process, and returns to the main process. 

### The game 

An extemely simplistic "game" will be implemented as example :
A multiplayer game based on websocket
Each player as a position and a random color.
Each Client sees a square : the game arena, and a dot : the player position.
A client can move right, left, up or down. All connected client see change.
A client should render game screen as a canvas (for now).

