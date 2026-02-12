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
<img width="460" height="373" alt="image" src="https://github.com/user-attachments/assets/c435fc99-513b-40ed-96f9-a2cdf42fd68e" />
<img width="1873" height="908" alt="image" src="https://github.com/user-attachments/assets/1a4da3c1-f34c-4893-b665-5129af18d9c1" />
<img width="1717" height="949" alt="image" src="https://github.com/user-attachments/assets/e26bd7b2-cb4a-47a8-853b-508a64568547" />
<img width="1895" height="756" alt="image" src="https://github.com/user-attachments/assets/e036fe7a-c97c-4aa5-8900-74fc14071285" />
<img width="1748" height="306" alt="image" src="https://github.com/user-attachments/assets/0e79e056-0cc7-46e7-8141-74cdc112f77b" />




