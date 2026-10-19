from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

password = "Admin@123"

hashed_password = password_hash.hash(password)

print(hashed_password)