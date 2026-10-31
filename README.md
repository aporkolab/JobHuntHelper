# JobHuntHelper
This repository contains a Google Apps Script designed to help job seekers manage and track their job applications within a Google Spreadsheet. The script automates follow-ups, manages application statuses, and organizes job search efforts with customizable settings. For a detailed explanation and walkthrough, check out the associated Medium blog post at [my Medium blog](https://slumbersolver.medium.com/job-search-juggler-automate-your-application-follow-ups-bfbf6631a39a).

## Features

- **Automated Follow-Ups:** Set reminders for follow-up emails after a specified number of days.
- **Application Status Tracking:** Easily update and view the status of each application.
- **Interview Scheduling:** Keep track of upcoming telephone and in-person interviews.
- **Documentation Management:** Record what documents were attached to each application.
- **Salary Expectation Handling:** Note down if salary expectations were requested and what was provided.

## How to Use

1. **Set Up the Spreadsheet:**
   - Create a new Google Spreadsheet with a sheet named `Applications` (the script creates it with the required header row if it is missing).
   - The header row must contain the [required columns](#columns-description). Column order does not matter, and you can add any extra columns you like.

2. **Install the Script:** see [Installation](#installation).

3. **Run the Script:**
   - Reload the spreadsheet. A **Job Helper** menu appears.
   - Choose `Job Helper > Setup Triggers` to schedule the daily check (every morning between 8 and 9 AM in the script's time zone).
   - Allow any permissions requested by the script to interact with your Google Spreadsheet, Calendar and Gmail.

4. **Configure Your Details:**
   - Open `Job Helper > Open Control Panel` and save your name, phone number and the number of reminder days (1-30, default 8).
   - These values are used in the follow-up email drafts and stored per user in `PropertiesService`.

5. **Input Application Details:**
   - Enter the details of each job application into the respective columns.
   - Mark the `Warning Message Column` cell yellow (`#fbbc04`) when you want the script to follow up on an application.

6. **Monitor Your Applications:**
   - For e-mail applications (`Application Form` contains "e-mail") marked yellow, once the reminder days have passed, the script
     - creates a 30-minute calendar event on the next workday,
     - creates a Gmail draft to the contact person (in Hungarian if `Language` starts with "hu" or "magyar", otherwise in English),
     - colors the `Number of Interested Messages` cell red (`#ea4335`) so the follow-up is not created again.
   - Use `Job Helper > Manual Check for Follow-ups` to run the check at any time, and `Manual Report Generation` to build a `Reports` sheet with an applications-by-language chart.

7. **Update Status Manually:**
   - Manually update the status of your applications as you receive responses or attend interviews. A green (`#00ff00`) `Warning Message Column` means a response was received.

## Columns Description

The following columns are **required**; the script reads them by header name:

- `Company Name`: The name of the company where the application was sent.
- `Position`: The title of the position applied for.
- `Application Form`: How the application was submitted (e.g., online form, email).
- `Language`: The language of the application or the interview.
- `Application Time`: The date when the application was submitted.
- `Warning Message Column`: A reminder or alert set for yourself to follow up if you haven't heard back within a certain time frame.
- `Number of Interested Messages`: The count of communications you've received from the company, indicating their interest or responses to your application.
- `Name of the Contact Person`: The individual at the company who is your main point of contact, usually in HR or the hiring manager.
- `Contact E-mail Address`: The email address of your contact person for follow-ups or additional communication.

These columns are optional and only for your own tracking:

- `Job Description PDF Link`: A hyperlink to the PDF containing the job description, which can be a useful reference for interview preparation.
- `Job Link`: A direct link to the job posting on the company's career page or job board.
- `Comment`: Personal notes or initial impressions about the job or the application process.
- `What I Attached`: Documentation or files you've included with your application, such as a resume, cover letter, portfolio, etc.
- `They Asked for a Wage Claim`: Indicates whether the company has requested your salary expectations.
- `What I Gave`: Your response to the salary expectation inquiry, if applicable.
- `Feedback Time`: The date when you received feedback on your application, if any.
- `Telephone Interview`: The date and time of a scheduled telephone interview.
- `1st Interview`: The date and time of your first in-person or video interview.
- `2nd Interview`: The date and time of your second interview, if applicable.
- `3rd Interview`: The date and time of your third interview, if applicable.
- `Test/Trial Assignment`: Details about any practical tests or assignments given to you as part of the application process.
- `Offer`: Information on the job offer received, including the date of the offer and any pertinent details.

## Installation

### With clasp (recommended)

1. Install [Node.js](https://nodejs.org/) 22.13 or newer and run `npm ci`.
2. Open your Google Spreadsheet, click on `Extensions > Apps Script` and copy the script ID from `Project Settings`.
3. Copy `.clasp.json.example` to `.clasp.json` and replace `<YOUR_SCRIPT_ID>` with your script ID (`.clasp.json` is git-ignored).
4. Log in with `npx clasp login` and push the code with `npm run push`.
5. Reload the spreadsheet and run `Job Helper > Setup Triggers`.

### Manually

1. Open your Google Spreadsheet where you wish to track job applications.
2. Click on `Extensions > Apps Script` to open the script editor.
3. Create a script file for every `.js` file in `src/` and copy its content. Create the HTML files with their folder in the name: `html/sidebar`, `html/stylesheet` and `html/client-js`.
4. Copy `src/appsscript.json` into the project manifest (enable `Show "appsscript.json" manifest file in editor` in `Project Settings`).
5. Save, reload the spreadsheet and run `Job Helper > Setup Triggers`.

## Configuration

Defaults live in `src/config.js`: sheet and column names, the default reminder days, status colors, the calendar ID (`primary`) and the fallback name/phone used when nothing has been saved in the Control Panel. The project needs no environment variables or secrets.

## Development

| Tool | Version |
|---|---|
| Node.js | 22.13+ (CI runs on 22 and 24) |
| Google Apps Script | V8 runtime |
| ESLint | 10 (flat config, `eslint.config.cjs`) |
| Jest | 30 |
| clasp | 3 |

```bash
npm ci          # install dependencies
npm run lint    # ESLint
npm test        # Jest unit tests
npm run check   # lint + tests (same as CI)
```

The code in `src/` runs inside Google Apps Script, so it must stay a plain script: no `require`, no ES modules and no Node-only APIs. Every file shares one global scope; cross-file references are declared with `/* global */` and `/* exported */` comments. The tests load the real source files into an isolated V8 context (`tests/helpers/gas.js`) with mocked Apps Script services, in the order given by `filePushOrder` in `.clasp.json.example`.

## Associated Medium Blog Post

For a comprehensive guide and best practices on using this job application tracker, please refer to our Medium blog post: [Job Search Juggler: Automate Your Application Follow-Ups](https://link.medium.com/DvmGNw6ZpEb).

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your updates.

## License

This project is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact

For support or queries, please open an issue in the repository, and I will get back to you as soon as possible.

Happy job hunting!
