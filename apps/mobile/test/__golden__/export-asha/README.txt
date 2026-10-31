Your Early Letters export

Made on Monday, March 15, 2027. Everything below was on this phone when you made it.

WHAT IS IN HERE

book/       A printable book for each child, by month of age (PDF).
            Letters you kept private are not in the printable book.
            They are in letters/ and data/ with everything else.
letters/    Every letter and note as a plain text file, one folder per child and month.
audio/      Every recording on this phone, exactly as it was made (AAC audio, as .m4a or .aac).
            Open them in any music or video player.
data/       entries.json: every letter, with your words exactly as heard, every small
            fix, and the final text. children.json: the books on this phone.
            account.json: your plan, whether you were signed in, the books you belong to,
            the names we always spell your way, your consent choices and, when you are
            signed in, your profile (see below).
schema/     A description of the data files, for anyone building a reader.
index.html  Open in any web browser to read every letter and hear every recording.
            It works with no connection and no app.

RECORDINGS

Each recording is the original file, byte for byte. Nothing was changed.
A letter whose recording is on another phone, or was never made, says so in data/entries.json.

YOUR CHOICES ON THIS PHONE

account.json says whether you answered yes to "Are you 18 or older?" on this phone,
and your choice about sharing usage and crash reports ("not_answered" if you have
not answered). These are the answers kept on this phone.

YOUR CONSENT HISTORY

When you are signed in, our server keeps a record of each time you agreed to, declined
or acknowledged our terms, and each privacy choice you made or withdrew. account.json
holds that record under "consent_history" when it could be read while the export was
made. If it could not, "status" says why ("not_signed_in", "unavailable" or
"different_account"), and nothing from this phone is left out because of it.

YOUR PROFILE

When you are signed in, account.json also holds your profile as our server keeps it,
under "profile", when it could be read while the export was made: the name on your
account, your usual "From" name (a book can have its own, in "memberships"), and when
you made your account. Its "status" works the same way as the consent history's.

CHECKING THE FILES

manifest.json lists every file with its size and SHA-256 fingerprint.
manifest.sha256 holds the fingerprint of manifest.json itself.
To check a file on a Mac:      shasum -a 256 audio/FILE
To check a file on Windows:    certutil -hashfile audio\FILE SHA256
FILE is the full name of the recording, ending in .m4a or .aac.
The result should match the line for that file in manifest.json.

KEEPING IT SAFE

This export is not locked with a password. Keep it somewhere private,
and keep a second copy somewhere else.

Format early-letters-export, version 1.4.0. Questions: hello@earlyletters.com
