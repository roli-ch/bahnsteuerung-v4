//  Programm name:    Bahnsteuerung-V4
//  Beschreibung.....
//  *************************************
//  V0 Erstausgabe    17.3.2026
//  V1 Version        25.3.2026
//  V2 Version        20.5.2026
//  V3 Version        23.6.2026
//  V4 Version        12.7.2026   Steuerung  mit IO-Extender erweitert
//  - Basis Steuermodul erstellt und Hauptmodul für 3 Steuerungen erstellt

//  =====================================
//  Init Konstanten
//  =========================
let debugRamp = 0
let debugSteu = 0
let uBnom = 3.3
let uPwmFactor = 1023 / 100
let uK1InputPin = AnalogPin.P0
let uK2InputPin = AnalogPin.P1
let uK3InputPin = AnalogPin.P2
let uK1OutputPin = AnalogPin.P3
let uK2OutputPin = AnalogPin.P4
let uK3OutputPin = AnalogPin.P10
//  GroundPin für pwm wird erst nach initialisierung des microbits eingeschaltet
//  gndOutPin = DigitalPin.P11
//  pins.digital_write_pin(gndOutPin, 0)
pins.analogWritePin(uK1OutputPin, 0)
pins.analogWritePin(uK2OutputPin, 0)
pins.analogWritePin(uK3OutputPin, 0)
// pause(5000)
let eaK1InputPin = DigitalPin.P6
pins.setPull(eaK1InputPin, PinPullMode.PullDown)
let eaK2InputPin = DigitalPin.P8
pins.setPull(eaK2InputPin, PinPullMode.PullDown)
let eaK3InputPin = DigitalPin.P12
pins.setPull(eaK3InputPin, PinPullMode.PullDown)
let vrK1InputPin = DigitalPin.P7
pins.setPull(vrK1InputPin, PinPullMode.PullDown)
let vrK2InputPin = DigitalPin.P9
pins.setPull(vrK2InputPin, PinPullMode.PullDown)
let vrK3InputPin = DigitalPin.P13
pins.setPull(vrK3InputPin, PinPullMode.PullDown)
let vorK1OutputPin = DigitalPin.P14
let vorK2OutputPin = DigitalPin.P15
let vorK3OutputPin = DigitalPin.P16

let rampGradient = 10       //  %/sec
let rampUmin = 10           //  %
let uMax = 100              //  %
let uNomV = 12              //  V
let base_loop = 1000        //  1s
let log_loop = 1000 * 60    //  1  Min.

//  Init Variablen
//  =========================
let loopNr = 0
led.enable(false)
let rTime = input.runningTime() //  ms
let dTime = 0                   //  ms
let loopTime = 0                //  ms
let zoom = false
let u_pwm = 100                 //  0..100%
let uBoard = 0                  //  U board in V
let uBoardRoh = 0
let remChanged = 0
let kreisNr = 0

//  Kreis 1
// ------------
let einK1 = 0
//  K1 ist aktiv
let vorK1 = 0
let vorK1changed = 0
let einK1changed = 0
let uSollK1 = 0
//  0-100% aktueller Sollwert (Potentiometer)
let uIstK1 = 0

//  Kreis 2
// ------------
let einK2 = 0
//  K2 ist aktiv
let vorK2 = 0
let vorK2changed = 0
let einK2changed = 0
let uSollK2 = 0
//  0-100% aktueller Sollwert (Potentiometer)
let uIstK2 = 0

/*
let eaK2 = 0
einK2 = 0
let vrK2 = 0
let remChangedK2 = 0
let remChangedVrK2 = 0
let rem_uSollK2 = 0
let remChangedUsollK2 = 0
*/

//  Kreis 3
// ------------
let einK3 = 0
//  K3 ist aktiv
let vorK3 = 0
let vorK3changed = 0
let einK3changed = 0
let uSollK3 = 0
//  0-100% aktueller Sollwert (Potentiometer)
let uIstK3 = 0

/*
let eaK3 = 0
einK3 = 0
let vrK3 = 0
vorK3 = 0
let remChangedK3 = 0
let remChangedVrK3 = 0
let rem_uSollK3 = 0
let remChangedUsollK3 = 0
*/

let stop = 0
//  alle Kreise stop
let test = false
// up = True
//  Radio
radio.on()
radio.setGroup(1)
radio.setTransmitPower(7)
//  default 6
let sendRequest = 0
//  KreisNr
let remCtrl = 0
// pins.analog_set_period(DigitalPin.P9, 1000)     # 1000 us; wenn DigitalPin -> kein Effect

console.log(" Bahnsteuerung Init")
showInfo()
console.log(" vvvvvvvvvvvvvvvvvvvvv")
pause(2000)

//  Buttons
//  =========================
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    console.log("============")
    console.log("Button A")
    showInfo()
})
input.onButtonPressed(Button.B, function on_button_pressed_b() { 
    //  stop Kreis 1-3
    console.log("============")
    console.log("Botton B")
    console.log("Stop all")
    stop = 1
    einK1 = 0
    einK2 = 0
    einK3 = 0
})
input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    //  Remote Control Ein/Aus
    console.log("============")
    console.log("AB: Freigabe Remote Control")
    if (remCtrl) {
        remCtrl = 0
    } else {
        remCtrl = 1
    }
    console.log("Remote Control = " + remCtrl)
    sendRequest = 1
    sendData()
    sendRequest = 2
    sendData()
    sendRequest = 3
    sendData()
})

input.onPinPressed(TouchPin.P0, function on_pin_pressed_p0() {
    console.log("P0")
})

//  Funk
//  ===================================
//  Daten senden
function sendData() {
    
    if (sendRequest == 1) {
        //  Senden
        radio.sendNumber(1)
        radio.sendValue("remCtrl", remCtrl)
        radio.sendValue("einK1", einK1)
        radio.sendValue("vorK1", vorK1)
        radio.sendValue("uIstK1", uIstK1)
        sendRequest = 0
        console.log("K1 Daten gesendet")
    }
    if (sendRequest == 2) {
        //  Senden
        radio.sendNumber(2)
        radio.sendValue("einK2", einK2)
        radio.sendValue("vorK2", vorK2)
        radio.sendValue("uIstK2", uIstK2)
        sendRequest = 0
        console.log("K2 Daten gesendet")
    }
    if (sendRequest == 3) {
        //  Senden
        radio.sendNumber(3)
        radio.sendValue("einK3", einK3)
        radio.sendValue("vorK3", vorK3)
        radio.sendValue("uIstK3", uIstK3)
        sendRequest = 0
        console.log("K3 Daten gesendet")
    }
}

//  Daten Empfangen
radio.onReceivedNumber(function on_received_number(receivedNumber: number) {
    let signal = radio.receivedPacket(RadioPacketProperty.SignalStrength)
    console.log("signal: " + signal)
    console.log("receiced nr: " + receivedNumber)
    basic.showNumber(receivedNumber)
})
radio.onReceivedString(function on_received_string(receivedString: string) {
    console.log("received: " + receivedString)
})
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    let idx: number;
    console.log("daten empfangen: " + name + " = " + value + "; remCtrl: " + remCtrl)
    if (remCtrl) {
        //  Kreis 1
        idx = 0
        if (name == "einK1") {
            einK1 = value
        } else if (name == "vorK1") {
            vorK1 = value
            vorK1changed = 1
        } else if (name == "speedK1") {
            uSollK1 = value
        }
        //  Kreis 2
        idx = 1
        if (name == "einK2") {
            einK2 = value
        } else if (name == "vorK2") {
            vorK2 = value
            vorK2changed = 1
        } else if (name == "speedK2") {
            uSollK2 = value
        }
        //  Kreis 3
        idx = 2
        if (name == "einK3") {
            einK3 = value
        } else if (name == "vorK3") {
            vorK3 = value
            vorK3changed = 1
        } else if (name == "speedK3") {
            uSollK3 = value
        }
    }
})

//  Funktionen
//  ===================================
//  myMath
//  Zahl auf anz Nachkommestellen runden
function round(val: number, anz: number): number {
    let fact = 1
    for (let i = 1; i < anz + 1; i++) {
        fact = fact * 10
    }
    // print("fact= "+fact+" i: "+i)
    val = Math.round(val * fact) / fact
    // print("val: "+val)
    return val
}

//  Daten anzeigen
function showData() {
    let show = true
    if (show) {
        serial.writeLine("Serial write:")
        serial.writeValue(" rTime (min)", rTime / 60)
        serial.writeValue("uBoard", uBoard)
    }
}

// serial.write_value("UOut", uOut)
function showInfo() {
    console.log("======================")
    console.log("Show Info")
    console.log("-----------------")
    console.log("loopNr: " + ("" + loopNr) + "; loopTime: " + loopTime + " ms; time: " + ("" + rTime / 1000) + " s")
    console.log("Stop: " + stop + "; remote control: " + remCtrl)
    console.log("-----------------")
    console.log("Kreis 1: ein = " + einK1 + "; vor = " + vorK1 + "; einK1changed = " + einK1changed + "; vorK1changed = " + vorK1changed)
    console.log("Kreis 1: U soll = " + round(uSollK1, 1) + " %; U ist = " + round(uIstK1, 1) + " % ; " + round(uIstK1 / 100 * uNomV, 1) + " V")
    console.log("Kreis 2: ein = " + einK2 + "; vor = " + vorK2 + "; einK2changed = " + einK2changed + "; vorK2changed = " + vorK2changed)
    console.log("Kreis 2: U soll = " + round(uSollK2, 1) + " %; U ist = " + round(uIstK2, 1) + " % ; " + round(uIstK2 / 100 * uNomV, 1) + " V")
    console.log("Kreis 3: ein = " + einK3 + "; vor = " + vorK3 + "; einK3changed = " + einK3changed + "; vorK3changed = " + vorK3changed)
    console.log("Kreis 3: U soll = " + round(uSollK3, 1) + " %; U ist = " + round(uIstK3, 1) + " % ; " + round(uIstK3 / 100 * uNomV, 1) + " V")
}

//  Spannung über Rampe ein/ausschalten
//  Einschalten bei uMin: Motor beginnt zu drehen
function uRampOnOff(up: boolean, uSoll: number, uIst: number, uOutputPin: number): number {
    let gradient = rampGradient
    //  %/s
    let dt = 100
    //  ms
    let dU = 100 / 1000 * gradient
    //  %
    let uMin = 20
    //  %
    // print("uRampOnOff: uIst= "+uIst)
    if (up) {
        if (uSoll > uMin) {
            uIst = uMin
            console.log("Spg Rampe einschalten: uSoll= " + round(uSoll, 1) + "; uIst= " + round(uIst, 1))
            while (uIst + dU < uSoll) {
                uIst += dU
                pause(dt)
                console.log("uIst: " + round(uIst, 1))
                pins.analogWritePin(uOutputPin, uIst * uPwmFactor)
            }
            uIst = uSoll
            console.log("Spg Rampe ein: uSoll= " + round(uSoll, 1) + "; uIst= " + round(uIst, 1))
        }
    } else {
        console.log("Spg Rampe ausschalten: uSoll= " + round(uSoll, 1) + "; uIst= " + round(uIst, 1))
        while (uIst - dU > uMin) {
            uIst -= dU
            pause(dt)
            console.log("uIst: " + round(uIst, 1))
            pins.analogWritePin(uOutputPin, uIst * uPwmFactor)
        }
        uIst = 0
        console.log("Spg Rampe aus: uSoll= " + round(uSoll, 1) + "; uIst= " + round(uIst, 1))
    }
    return uIst
}

function kreisSteuerung(kreisNr: number, eaInputPin: number, ein: number, einChanged: number, vrInputPin: number, vor: number, vorChanged: number, vorOutputPin: number, uInputPin: number, uSoll: number, uIst: number, uOutputPin: number, sendRequest: number): number[] {
    let uSollPoti: number;
    let diff_u: number;
    
    //  Funktion Richtungswechsel
    function richtungswechsel(uIst: number): number {
        console.log("Richtungswechsel: U ramp down - umschalten - ramp up")
        if (ein) {
            console.log("U ramp down")
            uIst = uRampOnOff(false, uSoll, uIst, uOutputPin)
            // uIst = uRampOnOffLoc(False)
            console.log("Umschalten Vor: " + vor)
            pins.digitalWritePin(vorOutputPin, vor)
            console.log("U ramp up")
            uIst = uRampOnOff(true, uSoll, uIst, uOutputPin)
        } else {
            // uIst = uRampOnOffLoc(True)
            console.log("Umschalten Vor: " + vor)
            pins.digitalWritePin(vorOutputPin, vor)
            uIst = 0
        }
        return uIst
    }
    
    //  ------------------------------
    //  Check Kreis ein/aus
    //  einK, einChanged = toggle_in(pins.digital_read_pin(eaInputPin), ein, einChange)     # Ckeck ob EA-Pin Kreis geändert
    if (debugSteu) {
        console.log("**** kreisSteuerung: ein:" + ein + "; changeEin:" + einChanged)
    }
    if (pins.digitalReadPin(eaInputPin)) {
        if (debugSteu) {
            console.log("------------------------------------")
            console.log("Check Richtungswechsel: ein= " + ein + "; einChanged= " + einChanged)
        }
        
        if (!einChanged) {
            if (ein) {
                ein = 0
                console.log("Kreis" + kreisNr + " Ausschalten; uIst:" + round(uIst, 1))
            } else {
                ein = 1
                console.log("Kreis" + kreisNr + " Einschalten; uIst:" + round(uIst, 1))
            }
            
            // uSollchanged = 1
            sendRequest = kreisNr
            einChanged = 1
        }
        if (debugSteu) {
            console.log("**Kreis" + kreisNr + " ein:" + ein)
        }
    } else {
        einChanged = 0
    }
    /** 
    if einK:
        if stop:
            print("Reset stop")
            stop = 0
            #sendRequest = kreisNr
     */
    
    //  ------------------------------
    //  Check Richtungswechsel
    if (pins.digitalReadPin(vrInputPin)) {
        if (debugSteu) {
            console.log("------------------------------------")
            console.log("Check Richtungswechsel: vor= " + vor + "; vorChanged= " + vorChanged)
        }
        // vorK, vorChanged = toggleEA(vor, vorChange)
        if (!vorChanged) {
            if (vor) {
                vor = 0
                console.log("Kreis" + kreisNr + " Retour; uIst:" + round(uIst, 1))
            } else {
                vor = 1
                console.log("Kreis" + kreisNr + " Vor; uIst:" + round(uIst, 1))
            }
            console.log("Richtungswechsel lokal")
            uIst = richtungswechsel(uIst)
            vorChanged = 1
        }
        if (debugSteu) {
            console.log("Check Richtungswechsel: vor= " + vor + "; vorChanged= " + vorChanged)
            console.log("**Kreis" + kreisNr + " vor:" + vor)
        }
    } else {
        if (remCtrl) {
            if (vorChanged) {
                console.log("Richtungswechsel remote")
                uIst = richtungswechsel(uIst)
            }
        }
        vorChanged = 0
    }
    
    //  ------------------------------
    //  U Sollwert lesen und Istwert setzen, wenn ein
    if (remCtrl) {
        if (ein) {
            uIst = uSoll
        }
    } else {
        uSollPoti = pins.analogReadPin(uInputPin) / uPwmFactor
        diff_u = Math.abs(uSoll - uSollPoti)
        if (diff_u > 1) {
            diff_u = round(diff_u, 1)
            console.log("time: " + ("" + rTime / 1000) + " s")
            console.log("Kreis " + kreisNr + " diff_u:  " + diff_u)
            // radio.sendValue("uIstK1", uSollK1)
            uSoll = uSollPoti
            if (ein) {
                uIst = uSoll
            } else {
                uIst = 0
                console.log("***time: " + ("" + rTime / 1000) + " s")
                console.log("Kreis " + kreisNr + " uIst:  " + round(uIst, 1))
            }
            sendRequest = kreisNr
        }
    }
    
    // pause(1000)
    // uSoll_old = uSoll
    // print("not remote")
    //  Werte ausgeben
    //  ========================
    // if not (rw_down_K1 and rw_up_K1):
    // if (rw_down_K1 + rw_up_K1 == 0):
    if (ein) {
        // pause(1000)
        // print("uIst: "+uIst)
        if (uIst < 1) {
            uIst = uRampOnOff(true, uSoll, uIst, uOutputPin)
        }
        pins.analogWritePin(uOutputPin, uIst * uPwmFactor)
    } else if (uIst > 1) {
        uIst = uRampOnOff(false, uSoll, uIst, uOutputPin)
        pins.analogWritePin(uOutputPin, uIst * uPwmFactor)
    }
    // pins.analog_write_pin(uOutputPin, 0)
    // test
    // pins.analog_write_pin(uOutputPin, 100 * uPwmFactor)
    /** 
    # Check ob Remote Ein/Aus
    if remChanged:
        if remCtrl:
            changed = 1
        remChanged = 0
        #print("kreisSteuerung: eaNeu: "+eaNeu)
    */
    //  ---------------------
    //  Rückgabewerte an main
    if (debugSteu) {
        console.log("** kreisSteuerung Return: ein:" + ein + "; einChanged:" + einChanged)
    }
    //    einK1,  einK1changed, vorK1, vorK1changed, uSollK1, uIstK1
    return [ein, einChanged, vor, vorChanged, uSoll, uIst]
}

//  Main Loop
//  =====================================
basic.forever(function on_forever() {
    loopTime = input.runningTime() - rTime
    rTime = input.runningTime()
    //  Kreis Steuerung
    //  Kreis 1
    let kreisNr = 1
    if (debugSteu) {
        console.log("call kreisSteuerung: einK1: " + einK1)
    }
    //console.log("*0 vorK1 " + vorK1)
    let kreis1res = kreisSteuerung(kreisNr, eaK1InputPin, einK1, einK1changed, vrK1InputPin, vorK1, vorK1changed, vorK1OutputPin, uK1InputPin, uSollK1, uIstK1, uK1OutputPin, sendRequest)
    einK1 = kreis1res[0]
    einK1changed = kreis1res[1]
    vorK1 = kreis1res[2]
    vorK1changed = kreis1res[3]
    uSollK1 = kreis1res[4]
    uIstK1 = kreis1res[5]
    //console.log("*1 vorK1 " + kreis1res[2])

    kreisNr = 2
    //console.log("*0 vorK2 " + vorK2)
    let kreis2res = kreisSteuerung(kreisNr, eaK2InputPin, einK2, einK2changed, vrK2InputPin, vorK2, vorK2changed, vorK2OutputPin, uK2InputPin, uSollK2, uIstK2, uK2OutputPin, sendRequest)
    einK2 = kreis2res[0]
    einK2changed = kreis2res[1]
    vorK2 = kreis2res[2]
    vorK2changed = kreis2res[3]
    uSollK2 = kreis2res[4]
    uIstK2 = kreis2res[5]
    //console.log("* vorK2 " + kreis2res[2])

    kreisNr = 3
    //console.log("*0 vorK3 " + vorK3)
    let kreis3res = kreisSteuerung(kreisNr, eaK3InputPin, einK3, einK3changed, vrK3InputPin, vorK3, vorK3changed, vorK3OutputPin, uK3InputPin, uSollK3, uIstK3, uK3OutputPin, sendRequest)
    einK3 = kreis3res[0]
    einK3changed = kreis3res[1]
    vorK3 = kreis3res[2]
    vorK3changed = kreis3res[3]
    uSollK3 = kreis3res[4]
    uIstK3 = kreis3res[5]
    //console.log("* vorK3 " + kreis3res[2])

    sendData()
    //  -------------
    // if nr >= 100:
    dTime += loopTime
    if (dTime > 4000) {
        //  4s
        // showInfo()
        dTime = 0
    }
    
    // u_in_roh_max = 0
    // u_out_roh_max = 0
    // basic.pause(base_loop)
    // basic.pause(500)
    basic.pause(100)
})
