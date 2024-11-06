<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index'); //route home page

$routes->get('/register', 'User::register'); //route to register page

$routes->get('/login', 'User::login'); //route to login page

$routes->get('/logout', 'User::logout'); //route to logout

$routes->post('/store', 'User::store'); //route to store data in database

$routes->post('/verifylogin', 'User::verifylogin'); //route to verify login

$routes->get('/profile', 'User::profile'); //route to profile page

$routes->post('/update', 'User::update'); //route to update data of the user
