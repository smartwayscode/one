const nodemailer = require('nodemailer');

// Set up AWS SES configuration
const transporter = nodemailer.createTransport({
    host: 'ssl0.ovh.net',  // OVH SMTP server
    port: 465,              // Port for secure connection
    secure: true,           // Use SSL/TLS
    auth: {
      user: 'taurus@satisfyinsight.com',      // Your OVH email address
      pass: 'InsightTaurus',         // Your OVH email password
    },
  });
  
client = process.argv[2];
toClient = process.argv[3];
site = process.argv[4];

// Create a Nodemailer transporter using the AWS SES transport
const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // January is 0, so we add 1 to get the month number
      const day = String(now.getDate()).padStart(2, '0');
      const dateWithoutHours = `${day}-${month}-${year}`;
// Define the email options

const mailOptions = {
  from: 'taurus@satisfyinsight.com', 
  to: toClient, 
  subject: 'Daily Data Kartago',
  html: `
    <html>
      <head>
        <style>
          /* Define your styles here */
          body {
            font-family: Arial, sans-serif;
            background-color: #ffffff;
          }
          .logo {
            text-align: center;
            padding: 20px 0;
          }
          .logo img {
            max-width: 190px;
            height: 60;
            margin-top: 20px;
          }
          .content {
            padding: 20px;
            background-color: #f5f5f5;
            padding: 20px;
            width: 50%;
            margin: 0 auto;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #37c0c8;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
      </head>
        <body>
            <div class="content" >
                <h1>Hello ${client},</h1>
                        <p>We've attached your daily data Excel file of ${site} Website Content. <br> 
                        The Extraction of the data was done on ${dateWithoutHours} at 9AM.
                        </p>
                  <h4>Best Regards, Have a Great day!</h4>
            </div>
          <div class="logo">
            <img src="https://drive.google.com/uc?export=view&id=1u0OCiK_bT-vEEmeuv7PxIOFdj54MVN7Q" height="70" width="220" alt="Satisfy_insight_logo">
            <p style="color: #aaa; ">Your Satisfaction is our Goal</p>
          </div>
      </body>
    </html>
  ` , 
  attachments: [
    {
    //   path: `./Kartago-${dateWithoutHours}.xlsx`,
      path: `./Kartago-12-01-2024.xlsx`,

    },
    
  ]
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
