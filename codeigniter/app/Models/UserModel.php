<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users'; // Change to your actual table name
    protected $primaryKey = 'id';
    protected $allowedFields = ['username', 'email', 'password'];

    public function is_email_exist($email, $userId = null) {
        $builder = $this->db->table($this->table);
        $builder->where('email', $email);
        if ($userId) {
            $builder->where('id !=', $userId); // Exclude current user if updating
        }
        return $builder->countAllResults() > 0;
    }

    public function is_username_exist($username, $userId = null) {
        $builder = $this->db->table($this->table);
        $builder->where('username', $username);
        if ($userId) {
            $builder->where('id !=', $userId); // Exclude current user if updating
        }
        return $builder->countAllResults() > 0;
    }
}