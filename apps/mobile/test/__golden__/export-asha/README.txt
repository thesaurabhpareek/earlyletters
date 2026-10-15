Your Early Letters export

Made on Monday, March 15, 2027. Everything below was on this phone when you made it.

WHAT IS IN HERE

book/       A printable book for each child, by month of age (PDF).
            Letters you kept private are not in the printable book.
            They are in letters/ and data/ with everything else.
letters/    Every letter and note as a plain text file, one folder per child and month.
audio/      Every recording on this phone, exactly as it was made (M4A, AAC).
            Open them in any music or video player.
data/       entries.json: every letter, with your words exactly as heard, every small
            fix, and the final text. children.json: the books on this phone.
            account.json: your plan and the choices you made on this phone (see below).
schema/     A description of the data files, for anyone building a reader.
index.html  Open in any web browser to read every letter and hear every recording.
            It works with no connection and no app.

RECORDINGS

Each recording is the original file, byte for byte. Nothing was changed.
A letter whose recording is on another phone, or was never made, says so in data/entries.json.

YOUR CHOICES ON THIS PHONE

account.json says whether you answered yes to "Are you 18 or older?" on this phone,
and your choice about sharing usage reports ("not_answered" if you were never asked).
These choices stay on this phone. This version of the app has no account and keeps
no record of them anywhere else.

CHECKING THE FILES

manifest.json lists every file with its size and SHA-256 fingerprint.
manifest.sha256 holds the fingerprint of manifest.json itself.
To check a file on a Mac:      shasum -a 256 audio/FILE.m4a
To check a file on Windows:    certutil -hashfile audio\FILE.m4a SHA256
The result should match the line for that file in manifest.json.

KEEPING IT SAFE

This export is not locked with a password. Keep it somewhere private,
and keep a second copy somewhere else.

Format early-letters-export, version 1.1.0. Questions: hello@earlyletters.com
