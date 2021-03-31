'use strict'
const fs = require('fs')
const u = require('@elife/utils')

const StellarSdk = require('stellar-sdk')

/*    understand/
 * this is the main entry point of our page
 *
 *    way/
 * Load the avatar's wallet information and
 * set up the user input handlers
 */
function main() {
    loadAvatarWallet((err, wallet) => {
        if(err) showErr(err)
        else SetupInputHandlers(wallet)
    })
}


/*    way/
 * read the secret file (ignoring comments)
 * as a JSON and get the avatar's key info
 */
function loadAvatarWallet(cb) {
    fs.readFile(u.secretFile(), 'utf8', (err, data) => {
        if(err) return cb(err)
        try {
            data = data.replace(/\s*#[^\n]*/g, "")
            data = JSON.parse(data)
            if(data.stellar && data.stellar.publicKey && data.stellar.secretKey) {
                cb(null, {
                    pub: data.stellar.publicKey,
                    _kp: StellarSdk.Keypair.fromSecret(data.stellar.secretKey),
                })
            } else {
                cb()
            }
        } catch(e) {
            cb(e)
        }
    })

}

function SetupInputHandlers(avaWallet) {
    console.log(avaWallet)
}

function showErr(err) {
    console.error(err)
    alert("Error! Cannot proceed")
}

main()
