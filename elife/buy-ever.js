'use strict'
const fs = require('fs')
const u = require('@elife/utils')

const StellarSdk = require('stellar-sdk')

/*    understand/
 * this is the main entry point of our page
 *
 *    way/
 * Load the avatar's wallet information and
 * show it to the user, then set up the user
 * input handlers
 */
function main() {
    loadAvatarWallet((err, wallet) => {
        if(err) showErr(err)
        else {
            ShowWallet(wallet)
            SetupInputHandlers({avaWallet: wallet})
        }
    })
}

function ShowWallet(wallet) {
    const e = document.getElementById("ava-wallet")
    e.innerText = wallet.pub
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

/*      way/
 * setup user wallet handler, currency handler, and button handler
 */
function SetupInputHandlers(ctx) {
    ctx.elems = {
        userWallet: document.getElementById("your-wallet"),
        currency: document.getElementById("from-currency"),
        btn: document.getElementById("go"),
    }

    setupWalletHandler(ctx)
    setupCurrencyHandler(ctx)
    setupButtonHandler(ctx)
}

function setupWalletHandler(ctx) {
}

function setupCurrencyHandler(ctx) {
}

function setupButtonHandler(ctx) {
}

function showErr(err) {
    console.error(err)
    alert("Error! Cannot proceed")
}

main()
