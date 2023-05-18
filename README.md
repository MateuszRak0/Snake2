# Features

- Popular snake game in pure js/html/css no frameworks used.
- compatible with mobile and desktop devices. 
- two game modes Easy and Hard
- three diffrent snakes to choose

# Preview

![preview](https://images2.imgbox.com/4e/ee/EvOk0y25_o.png "preview")

# How it works ?
## structure
the whole game is based on three objects: Map, Snake and Point Manager.
enriched with several global functions that support menu navigation and setting game parameters before starting it. 
additionally, in the code we can find the Joystick object that allows us to control on touch devices and the Counter fired before each start of the game

------------

## Map
The map is a grid of 16x16px squares. It is generated with the size given by countMapSurface functions

##Snake
The snake references the map, checking its position after each move, if it has just entered a new square on the map, it adds the previous one to the array called snakeBody. if snakeBody is longer than the current possible length, the last element in array is removed

##PointsMenager
It is responsible for throwing apples (points) on the map, additionally it counts the points collected by the player and displays them on the screen

![](https://images2.imgbox.com/c8/d1/HWjlQ0O1_o.png)
