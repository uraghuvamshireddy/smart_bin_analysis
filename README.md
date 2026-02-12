create .env file in backend for secrets mentioned below and add them accordingly
DATABASE_URL=(create postgresql on your system and its url)
API_HOST
API_PORT
BACKEND_URL
SECRET_KEY

To start backend go to backend folder on console then python -m venv .venv then venv\Scripts\Activate.ps1 then uvicorn main:app --reload backend starts.
If getting error check if all dependencies are downloaded prperly and system configuration also.

Next you can click + and  go to  new terminal for frontend ( vs code ) and npm run dev to start frontend

For random_data generation go to backend then python generate_readings.py

If you get any errors while using this may be due to missing of dependencies or wrong system configuration 

To connect with hardware in backend go to configure and change false to true and mainly here to work you need many system conifgurations to do otherwise it wont work properly

and mainly there is no register page as users should not register they should be only able to login so yo uneed to register users using any tool like postman etc then only you will be able to login as admin or worker and use it
