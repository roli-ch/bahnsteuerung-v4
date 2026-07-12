# Programm name:    Bahnsteuerung-V4
# Beschreibung.....
# *************************************
# V0 Erstausgabe    17.3.2026
# V1 Version        25.3.2026
# V2 Version        20.5.2026
# V3 Version        23.6.2026
# V4 Version        12.7.2026   Steuerung  mit IO-Extender erweitert
# - Basis Steuermodul erstellt und Hauptmodul für 3 Steuerungen erstellt
# =====================================
# Init Konstanten
# =========================
debugRamp = 0
debugSteu = 0

uBnom = 3.3
uPwmFactor = 1023/100

uK1InputPin = AnalogPin.P0
uK2InputPin = AnalogPin.P1
uK3InputPin = AnalogPin.P2
uK1OutputPin = AnalogPin.P3
uK2OutputPin = AnalogPin.P4
uK3OutputPin = AnalogPin.P10

# GroundPin für pwm wird erst nach initialisierung des microbits eingeschaltet
# gndOutPin = DigitalPin.P11
# pins.digital_write_pin(gndOutPin, 0)

pins.analog_write_pin(uK1OutputPin, 100)
pins.analog_write_pin(uK2OutputPin, 0)
pins.analog_write_pin(uK3OutputPin, 0)
#pause(5000)

eaK1InputPin = DigitalPin.P6
pins.setPull(eaK1InputPin, PinPullMode.PULL_DOWN)
eaK2InputPin = DigitalPin.P8
pins.setPull(eaK2InputPin, PinPullMode.PULL_DOWN)
eaK3InputPin = DigitalPin.P12
pins.setPull(eaK3InputPin, PinPullMode.PULL_DOWN)

vrK1InputPin = DigitalPin.P7
pins.setPull(vrK1InputPin, PinPullMode.PULL_DOWN)
vrK2InputPin = DigitalPin.P9
pins.setPull(vrK2InputPin, PinPullMode.PULL_DOWN)
vrK3InputPin = DigitalPin.P13
pins.setPull(vrK3InputPin, PinPullMode.PULL_DOWN)

vorK1OutputPin = DigitalPin.P14
vorK2OutputPin = DigitalPin.P15
vorK3OutputPin = DigitalPin.P16

rampGradient = 10   # % / sec
rampUmin = 10       # %

uMax = 100     # %
uNomV = 12    # V

base_loop = 1000    # 1s
log_loop = 1000 * 60    # 1  Min.

# Init Variablen
# =========================

loopNr = 0

led.enable(False)
rTime = input.running_time()     # ms

dTime = 0   # ms
loopTime = 0    # ms
zoom = False
u_pwm = 100    # 0..100%

uBoard = 0     # U board in V
uBoardRoh = 0

remChanged = 0

kreisNr = 0

# Kreis 1
#------------
einK1 = 0      # K1 ist aktiv
vorK1 = 1
vorK1changed = 0
einK1changed = 0
uSollK1 = 0 # 0-100% aktueller Sollwert (Potentiometer)
uIstK1 = 0

# Kreis 2
#------------
einK2 = 0      # K2 ist aktiv
vorK2 = 1
vorK2changed = 0
einK2changed = 0
uSollK2 = 0 # 0-100% aktueller Sollwert (Potentiometer)
uIstK2 = 0

# Kreis 3
#------------
einK3 = 0      # K3 ist aktiv
vorK3 = 1
vorK3changed = 0
einK3changed = 0
uSollK3 = 0 # 0-100% aktueller Sollwert (Potentiometer)
uIstK3 = 0

eaK2 = 0
einK2 = 0
vrK2 = 0
vorK2 = 0
remChangedK2 = 0
remChangedVrK2 = 0
rem_uSollK2 = 0
remChangedUsollK2 = 0

eaK3 = 0
einK3 = 0
vrK3 = 0
vorK3 = 0
remChangedK3 = 0
remChangedVrK3 = 0
rem_uSollK3 = 0
remChangedUsollK3 = 0

stop = 0            # alle Kreise stop
test = False
#up = True

# Radio
radio.on()
radio.set_group(1)
radio.set_transmit_power(7) # default 6
sendRequest = 0     # KreisNr
remCtrl = 0

#pins.analog_set_period(DigitalPin.P9, 1000)     # 1000 us; wenn DigitalPin -> kein Effect
print(" Bahnsteuerung Init")
showInfo()
print(" vvvvvvvvvvvvvvvvvvvvv")
pause(2000)

# Buttons
# =========================
def on_logo_pressed():
    pass
input.on_logo_event(TouchButtonEvent.PRESSED, on_logo_pressed)

def on_button_pressed_a():
    global sendRequest

    print("============")
    print("Button A")
    showInfo()
    #sendRequest = 1
input.on_button_pressed(Button.A, on_button_pressed_a)

def on_button_pressed_b():
    global einK1, einK2, einK3, stop
    # stop Kreis 1-3
    print("============")
    print("Botton B")
    print("Stop all")
    stop = 1
    einK1 = 0
    einK2 = 0
    einK3 = 0
input.on_button_pressed(Button.B, on_button_pressed_b)

def on_button_pressed_ab():
    global remCtrl, sendRequest
    # Remote Control Ein/Aus
    print("============")
    print("AB: Freigabe Remote Control")
    if remCtrl:
        remCtrl = 0
    else:
        remCtrl = 1
    print("Remote Control = "+remCtrl)
    sendRequest = 1
    sendData()
    sendRequest = 2
    sendData()
    sendRequest = 3
    sendData()
 
input.on_button_pressed(Button.AB, on_button_pressed_ab)

def on_pin_pressed_p0():
    print("P0")
    pass
input.on_pin_pressed(TouchPin.P0, on_pin_pressed_p0)

# Funk
# ===================================
# Daten senden
def sendData():
    global sendRequest
    if sendRequest == 1:
        # Senden
        radio.send_number(1)
        radio.sendValue("remCtrl", remCtrl)
        radio.sendValue("einK1", einK1)
        radio.sendValue("vorK1", vorK1)
        radio.sendValue("uIstK1", uIstK1)
        sendRequest = 0
        print("K1 Daten gesendet")
    if sendRequest == 2:
        # Senden
        radio.send_number(2)
        radio.sendValue("einK2", einK2)
        radio.sendValue("vorK2", vorK2)
        radio.sendValue("uIstK2", uIstK2)
        sendRequest = 0
        print("K2 Daten gesendet")
    if sendRequest == 3:
        # Senden
        radio.send_number(3)
        radio.sendValue("einK3", einK3)
        radio.sendValue("vorK3", vorK3)
        radio.sendValue("uIstK3", uIstK3)
        sendRequest = 0
        print("K3 Daten gesendet")

# Daten Empfangen
def on_received_number(receivedNumber):
    signal = radio.received_packet(RadioPacketProperty.SIGNAL_STRENGTH)
    print("signal: "+ signal)
    print("receiced nr: "+receivedNumber)
    basic.show_number(receivedNumber)
radio.on_received_number(on_received_number)

def on_received_string(receivedString):
    print("received: "+receivedString)
radio.on_received_string(on_received_string)

def on_received_value(name, value):
    global remCtrl
    global einK1, einK1changed, vorK1, vorK1changed, uSollK1
    global einK2, einK2changed, vorK2, vorK2changed, uSollK2
    global einK3, einK3changed, vorK3, vorK3changed, uSollK3
    
    print("daten empfangen: " +name+ " = "+value+"; remCtrl: "+remCtrl)
    if remCtrl:
        # Kreis 1
        idx = 0
        if name == "einK1":
            einK1 = value
        elif name == "vorK1":
            vorK1 = value
            vorK1changed = 1
        elif name == "speedK1":
            uSollK1 = value
        
        # Kreis 2
        idx = 1
        if name == "einK2":
            einK2 = value
        elif name == "vorK2":
            vorK2 = value
            vorK2changed = 1
        elif name == "speedK2":
            uSollK2 = value

        # Kreis 3
        idx = 2
        if name == "einK3":
            einK3 = value
        elif name == "vorK3":
            vorK3 = value
            vorK3changed = 1
        elif name == "speedK3":
            uSollK3 = value
radio.on_received_value(on_received_value)

# Funktionen
# ===================================
    
# myMath
# Zahl auf anz Nachkommestellen runden
def round(val, anz):
    fact = 1
    for i in range(1, anz+1):
        fact = fact *10
        #print("fact= "+fact+" i: "+i)
    val = Math.round(val*fact)/fact
    #print("val: "+val)
    return val

# Daten anzeigen
def showData():
    show = True
    if show:
        serial.write_line("Serial write:")
        serial.write_value(" rTime (min)", rTime / 60)
        serial.write_value("uBoard", uBoard)
        #serial.write_value("UOut", uOut)

def showInfo():
    global loopTime
    print( "======================")
    print( "Show Info")
    print("-----------------")
    print("loopNr: " + str(loopNr) + "; loopTime: " + loopTime + " ms; time: " + str(rTime / 1000) +" s")
    print("Stop: "+ stop+"; remote control: "+remCtrl)
    print("-----------------")
    print("Kreis 1: ein = " + einK1+ "; vor = " + vorK1+"; einK1changed = "+einK1changed+"; vorK1changed = "+vorK1changed)
    print("Kreis 1: U soll = " + round(uSollK1,1) +" %; U ist = " + round(uIstK1,1)+" % ; "+ round(uIstK1/100*uNomV,1)+" V")
    print("Kreis 2: ein = " + einK2+ "; vor = " + vorK2+"; einK2changed = "+einK2changed+"; vorK2changed = "+vorK2changed)
    print("Kreis 2: U soll = " + round(uSollK2,1) +" %; U ist = " + round(uIstK2,1)+" % ; "+ round(uIstK2/100*uNomV,1)+" V")
    print("Kreis 3: ein = " + einK3+ "; vor = " + vorK3+"; einK3changed = "+einK3changed+"; vorK3changed = "+vorK3changed)
    print("Kreis 3: U soll = " + round(uSollK3,1) +" %; U ist = " + round(uIstK3,1)+" % ; "+ round(uIstK3/100*uNomV,1)+" V")

# Spannung über Rampe ein/ausschalten
# Einschalten bei uMin: Motor beginnt zu drehen
def uRampOnOff (up, uSoll, uIst, uOutputPin):
    gradient = rampGradient      # %/s
    dt = 100     # ms
    dU = 100 / 1000 * gradient   # %
    uMin = 20   # %

    #print("uRampOnOff: uIst= "+uIst)
    if up:
        if uSoll > uMin:
            uIst = uMin
            print("Spg Rampe einschalten: uSoll= "+round(uSoll,1)+"; uIst= "+round(uIst,1))
            while uIst + dU < uSoll:
                uIst += dU
                pause(dt)
                print("uIst: "+round(uIst,1))
                pins.analog_write_pin(uOutputPin, uIst * uPwmFactor)
            uIst = uSoll
            print("Spg Rampe ein: uSoll= "+round(uSoll,1)+"; uIst= "+round(uIst,1))
    else:
        print("Spg Rampe ausschalten: uSoll= "+round(uSoll,1)+"; uIst= "+round(uIst,1))
        while uIst - dU > uMin:
            uIst -= dU
            pause(dt)
            print("uIst: "+round(uIst,1))
            pins.analog_write_pin(uOutputPin, uIst * uPwmFactor)
        uIst = 0
        print("Spg Rampe aus: uSoll= "+round(uSoll,1)+"; uIst= "+round(uIst,1))
    return uIst

def kreisSteuerung(kreisNr, eaInputPin, ein, einChanged, vrInputPin, vor, vorChanged, vorOutputPin, uInputPin, uSoll, uIst, uOutputPin, sendRequest):
    global sendRequest

    # Funktion Richtungswechsel
    def richtungswechsel(uIst):
        print("Richtungswechsel: U ramp down - umschalten - ramp up")
        if ein:
            print("U ramp down")
            uIst = uRampOnOff(False, uSoll, uIst, uOutputPin)
            #uIst = uRampOnOffLoc(False)
            print("Umschalten Vor: "+vor)
            pins.digital_write_pin(vorOutputPin, vor)
            print("U ramp up")
            uIst = uRampOnOff(True, uSoll, uIst, uOutputPin)
            #uIst = uRampOnOffLoc(True)
        else:
            print("Umschalten Vor: "+vor)
            pins.digital_write_pin(vorOutputPin, vor)
            uIst = 0
        return uIst
    
    # ------------------------------
    # Check Kreis ein/aus
    # einK, einChanged = toggle_in(pins.digital_read_pin(eaInputPin), ein, einChange)     # Ckeck ob EA-Pin Kreis geändert
    if debugSteu:
        print("**** kreisSteuerung: ein:"+ein+"; changeEin:"+einChanged)

    if pins.digital_read_pin(eaInputPin):
        if debugSteu:
            print("------------------------------------")
            print("Check Richtungswechsel: ein= "+ein+"; einChanged= "+einChanged)
        if not einChanged:
            if ein:
                ein = 0
                print("Kreis"+kreisNr+" Ausschalten; uIst:"+round(uIst,1))
            else:
                ein = 1
                print("Kreis"+kreisNr+" Einschalten; uIst:"+round(uIst,1))
            #uSollchanged = 1
            sendRequest = kreisNr
            einChanged = 1
        if debugSteu:
            print("**Kreis"+kreisNr+" ein:"+ein)
    else:
        einChanged = 0

    """
    if einK:
        if stop:
            print("Reset stop")
            stop = 0
            #sendRequest = kreisNr
    """
    # ------------------------------
    # Check Richtungswechsel
 
    if pins.digital_read_pin(vrInputPin):
        if debugSteu:
            print("------------------------------------")
            print("Check Richtungswechsel: vor= "+vor+"; vorChanged= "+vorChanged)
        #vorK, vorChanged = toggleEA(vor, vorChange)
        if not vorChanged:
            if vor:
                vor = 0
                print("Kreis"+kreisNr+" Retour; uIst:"+round(uIst,1))
            else:
                vor = 1
                print("Kreis"+kreisNr+" Vor; uIst:"+round(uIst,1))
            print("Richtungswechsel lokal")
            uIst = richtungswechsel(uIst)
            vorChanged = 1
        if debugSteu:
            print("Check Richtungswechsel: vor= "+vor+"; vorChanged= "+vorChanged)
            print("**Kreis"+kreisNr+" vor:"+vor)
    else:
        if remCtrl:
            if vorChanged:
                print("Richtungswechsel remote")
                uIst = richtungswechsel(uIst)
        vorChanged = 0

    # ------------------------------
    # U Sollwert lesen und Istwert setzen, wenn ein
    if remCtrl:
        if ein:
            uIst = uSoll
    else:
        uSollPoti = pins.analog_read_pin(uInputPin) / uPwmFactor
        diff_u = abs(uSoll - uSollPoti)
        if diff_u > 1:
            diff_u = round(diff_u, 1)
            print("time: " + str(rTime / 1000) +" s")
            print("Kreis "+kreisNr+" diff_u:  "+diff_u)
            #radio.sendValue("uIstK1", uSollK1)
            uSoll = uSollPoti
            if ein:
                uIst = uSoll
            else:
                uIst = 0
                print("***time: " + str(rTime / 1000) +" s")
                print ("Kreis "+kreisNr+" uIst:  "+round(uIst,1))
            sendRequest = kreisNr
            #pause(1000)
        #uSoll_old = uSoll
        #print("not remote")
   
    # Werte ausgeben
    # ========================
    #if not (rw_down_K1 and rw_up_K1):
    #if (rw_down_K1 + rw_up_K1 == 0):

    if ein:
        #pause(1000)
        #print("uIst: "+uIst)
        
        if uIst < 1:
            uIst = uRampOnOff(True, uSoll, uIst, uOutputPin)
        pins.analog_write_pin(uOutputPin, uIst * uPwmFactor)
    else:
        if uIst > 1:
            uIst = uRampOnOff(False, uSoll, uIst, uOutputPin)
            pins.analog_write_pin(uOutputPin, uIst * uPwmFactor)
        #pins.analog_write_pin(uOutputPin, 0)
    #test
    #pins.analog_write_pin(uOutputPin, 100 * uPwmFactor)

    """
    # Check ob Remote Ein/Aus
    if remChanged:
        if remCtrl:
            changed = 1
        remChanged = 0
        #print("kreisSteuerung: eaNeu: "+eaNeu)
    """
    # ---------------------
    # Rückgabewerte an main
    if debugSteu:
       print("** kreisSteuerung Return: ein:"+ein+"; einChanged:"+einChanged)
    #   einK1,  einK1changed, vorK1, vorK1changed, uSollK1, uIstK1
    return ein, einChanged, vor, vorChanged, uSoll, uIst

# Main Loop
# =====================================
def on_forever():
    global rTime,loopNr,loopTime,dTime,stop
    global einK1, einK1changed, vorK1, vorK1changed, uSollK1, uIstK1
    global einK2, einK2changed, vorK2, vorK2changed, uSollK2, uIstK2
    global einK3, einK3changed, vorK3, vorK3changed, uSollK3, uIstK3

    loopNr += 1
    loopTime = input.running_time() - rTime
    rTime = input.running_time()

    # Kreis Steuerung
    # Kreis 1
    kreisNr = 1
    if debugSteu:
        print("call kreisSteuerung: einK1: "+einK1)
    einK1, einK1changed, vorK1, vorK1changed, uSollK1, uIstK1 = kreisSteuerung(kreisNr, eaK1InputPin, einK1, einK1changed, vrK1InputPin, vorK1, vorK1changed, vorK1OutputPin, uK1InputPin, uSollK1, uIstK1, uK1OutputPin, sendRequest )
    #                                                                           kreisNr, eaInputPin,  ein, einChanged,     vrInputPin, vor,      vorChanged, vorOutputPin,    uInputPin,   uSoll,   uIst, uOutputPin,     sendRequest
    kreisNr = 2
    einK2, einK2changed, vorK2, vorK2changed, uSollK2, uIstK2 = kreisSteuerung(kreisNr, eaK2InputPin, einK2, einK2changed, vrK2InputPin, vorK2, vorK2changed, vorK2OutputPin, uK2InputPin, uSollK2, uIstK2, uK2OutputPin, sendRequest )
    kreisNr = 3
    einK3, einK3changed, vorK3, vorK3changed, uSollK3, uIstK3 = kreisSteuerung(kreisNr, eaK3InputPin, einK3, einK3changed, vrK3InputPin, vorK3, vorK3changed, vorK3OutputPin, uK3InputPin, uSollK3, uIstK3, uK3OutputPin, sendRequest )

    sendData()
    # -------------
    #if nr >= 100:
    dTime += loopTime
    if dTime > 4000:    # 4s
        #showInfo()
        dTime = 0
        #u_in_roh_max = 0
        #u_out_roh_max = 0

    #basic.pause(base_loop)
    #basic.pause(500)
    basic.pause(200)

basic.forever(on_forever)
