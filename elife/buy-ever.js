'use strict'
const fs = require('fs')
const u = require('@elife/utils')

const StellarSdk = require('stellar-sdk')

const EVER_ISSUER = process.env.EVER_ISSUER || 'GDRCJ5OJTTIL4VUQZ52PCZYAUINEH2CUSP5NC2R6D6WQ47JBLG6DF5TE'

/*    understand/
 * this is the main entry point of our page
 *
 *    way/
 * Load the avatar's wallet information and
 * show it to the user, then set up the user
 * input handlers
 */
function main() {
    const ctx = {
        avatar: {
            wallet: null,
            active: false,
        },
        user: {
            secret: null,
            acc: null,
        },
        paths: null,
        view: {
            fromAmt: "0.0",
            toAmt: "100",
            secret: null,
            currency: null,
            button: null,
        }
    }
    loadAvatarWallet(ctx, err => {
        if(err) showErr(err)
        else {
            ShowWallet(ctx)
            SetupInputHandlers(ctx)
        }
    })
}

/*      way/
 * Show the wallet info and the active message depending
 * on if we need to activate the account or nor
 */
function ShowWallet(ctx) {
    const ew = document.getElementById("ava-wallet")
    ew.innerText = ctx.avatar.wallet.pub

    if(ctx.avatar.active) {
        const em = document.getElementById("ava-activate")
        em.innerHTML = ""
    }
}

/*      way/
 * read the avatar wallet's information
 * and check the wallet's status
 */
function loadAvatarWallet(ctx, cb) {
    readAvatarWallet((err, wallet) =>  {
        if(err) cb(err)
        else {
            ctx.avatar.wallet = wallet
            loadAvatarStatus(ctx, cb)
        }
    })
}

/*    way/
 * read the secret file (ignoring comments)
 * as a JSON and get the avatar's key info
 */
function readAvatarWallet(cb) {
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
 * setup amount handler, user wallet handler, currency handler, and button handler
 */
function SetupInputHandlers(ctx) {
    ctx.view.fromAmt = document.getElementById("from-amt")
    ctx.view.toAmt = document.getElementById("ava-amt")
    ctx.view.secret = document.getElementById("your-wallet")
    ctx.view.currency = document.getElementById("from-currency")
    ctx.view.button = document.getElementById("go")

    setupAmountHandler(ctx)
    setupWalletHandler(ctx)
    setupCurrencyHandler(ctx)
    setupButtonHandler(ctx)
}

/*      understand/
 * When the amount changes, we need to recalculate the most
 * optimal paths for the payments
 */
function setupAmountHandler(ctx) {
    ctx.view.toAmt.addEventListener('keyup', () => {
        recalcPaths(ctx, err => {
            if(err) showErr(err)
            else showCurrencySelect(ctx)
        })
    })
}

/*      way/
 * save the user's wallet and recalculate the paths
 * using them to update the currency drop down
 */
function setupWalletHandler(ctx) {
    ctx.view.secret.addEventListener('input', () => {
        ctx.user.secret = ctx.view.secret.value
        ctx.user.balances = null
        recalcPaths(ctx, err => {
            if(err) showErr(err)
            else showCurrencySelect(ctx)
        })
    })
}

/*      way/
 * Save valid paths into the context
 */
function recalcPaths(ctx, cb) {
    ctx.paths = []
    const kp = getUserKeys(ctx)
    if(!kp) return cb()
    const server = getSvr()
    const asset = new StellarSdk.Asset("EVER", EVER_ISSUER)
    let amt = ctx.view.toAmt.value
    if(!amt) return cb()
    server.strictReceivePaths(kp.publicKey(), asset, amt)
        .call()
        .then(paths => {
            ctx.paths = paths.records
            cb()
        })
        .catch(cb)
}

function getUserKeys(ctx) {
    if(!ctx.user.secret) return
    try {
        return StellarSdk.Keypair.fromSecret(ctx.user.secret)
    } catch(e) {
        console.error(e)
    }
}

function showCurrencySelect(ctx) {
    ctx.view.currency.innerHTML = ""
    ctx.view.fromAmt.innerHTML = "0.0"
    if(!ctx.paths) return
    const o = document.createElement("option")
    if(!ctx.view.toAmt.value) o.innerText = ""
    else if(!ctx.paths.length) o.innerText = "(No Payment Path Found)"
    else o.innerText = "(Select)"
    o.value = -1
    ctx.view.currency.appendChild(o)
    for(let i = 0;i < ctx.paths.length;i++) {
        const p = ctx.paths[i]
        const o = document.createElement("option")
        o.innerText = p.source_asset_code || "XLM"
        o.value = i
        ctx.view.currency.appendChild(o)
    }
}

/*      way/
 * When the selected currency changes, update the amount
 * that will be sent from the corresponding path
 */
function setupCurrencyHandler(ctx) {
    ctx.view.currency.onchange = () => {
        ctx.view.fromAmt.innerHTML = "0.0"
        if(!ctx.paths) return
        const i = ctx.view.currency.value
        if(i < 0 || i >= ctx.paths.length) return
        const p = ctx.paths[i]
        const code = p.source_asset_code || "XLM"
        ctx.view.fromAmt.innerText = `${p.source_amount} ${code}`
    }
}

function setupButtonHandler(ctx) {
}

/*      understand/
 * Stellar 'horizon' is the gateway to the Stellar network. Stellar
 * gives us - by default - a 'test' horizon net to play and experiment
 * and the 'live' net to work with.
 *
 *      outcome/
 * Set up the correct network identifier and return the appropriate
 * stellar server.
 */
const LIVE_HORIZON = "https://horizon.stellar.org/"
const TEST_HORIZON = "https://horizon-testnet.stellar.org/"
function getSvr(horizon) {
    if("test" === process.env.ELIFE_STELLAR_HORIZON) {
        return new StellarSdk.Server(TEST_HORIZON)
    } else {
        return new StellarSdk.Server(LIVE_HORIZON)
    }
}

function loadAvatarStatus(ctx, cb) {
    const server = getSvr()
    server.loadAccount(ctx.avatar.wallet.pub)
    .then(acc => {
        ctx.avatar.active = true
        cb()
    })
    .catch(err => {
        if(err && err.name === "NotFoundError") {
            ctx.avatar.active = false
            cb()
        } else {
            cb(err)
        }
    })
}



function showErr(err) {
    console.error(err)
    alert("Error! Cannot proceed")
}

main()
