<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index()
    {
        //redirect to login if access index/home page without logging in
        if (!session()->get('logged_in')){
            return redirect()->to('/login');
        }

        return view('welcome_message');
    }
}
