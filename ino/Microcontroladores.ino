#include <Keypad.h>
#include <FiniteStateMachine.h>
#include <Servo.h>
#include <stdio.h>


// STATE MACHINE DEFINITION
const byte NUMBER_OF_STATES = 6;

// - Callback functions declaration
void doorLocked_enter(); void doorLocked_update(); void doorLocked_exit();
void doorUnlocked_enter(); void doorUnlocked_update(); void doorUnlocked_exit();
void doorOpened_enter(); void doorOpened_update(); void doorOpened_exit();
void writingKey_enter(); void writingKey_update(); void writingKey_exit();
void validatingKey_enter(); void validatingKey_update(); void validatingKey_exit();
void invalidKey_enter(); void invalidKey_update(); void invalidKey_exit();

// - State definition
State stDoorLocked = State(doorLocked_enter, doorLocked_update, doorLocked_exit);
State stDoorUnlocked = State(doorUnlocked_enter, doorUnlocked_update, doorUnlocked_exit);
State stDoorOpened = State(doorOpened_enter, doorOpened_update, doorOpened_exit);
State stWritingKey = State(writingKey_enter, writingKey_update, writingKey_exit);
State stValidatingKey = State(validatingKey_enter, validatingKey_update, validatingKey_exit);
State stInvalidKey = State(invalidKey_enter, invalidKey_update, invalidKey_exit);

// - State machine definition
FSM machine = FSM(stDoorLocked); // Create machine and set initial state


// KEYPAD INITIALIZATION
const byte ROWS = 4; // cuatro filas
const byte COLS = 3; // tres columnas (si el teclado es de 4 dejar la ultima sin cablear)
char keys[ROWS][COLS] = {
  {'1','2','3'},
  {'4','5','6'},
  {'7','8','9'},
  {'*','0','#'}
};
byte rowPins[ROWS] = {5, 4, 3, 2}; // pin teclado (pT) 1 a 5 Galileo, (pT) 2 a 4 Galileo;(pT) 3 a 3 Galileo;(pT) 4 a 2 Galileo;
byte colPins[COLS] = {8, 7, 6}; // pT 5 a 8 Galileo, pT 6 a 7 Galileo;pT 7 a 6 Galileo
Keypad keypad = Keypad( makeKeymap(keys), rowPins, colPins, ROWS, COLS );


// ACCESORY HARDWARE INITIALIZATION
const byte speaker = 13;

Servo servo;
const byte servoPin = 11;
int servoPos = 0;

const byte doorRead = 1;

String input;
float startMilis;

//------------------------------------------SETUP----------------------------------------------/
void setup(){
  Serial.begin(115200);
  
  pinMode(speaker, OUTPUT);
  pinMode(doorRead, INPUT);
  
  Serial.println("SETUP");
  
  // Set Up Wifi
  system("connmanctl enable wifi");
  system("connmanctl scan wifi");
  system("connmanctl connect wifi_74de2bbef231_446965676f6c_managed_none");
  
  // Start the web server
  system("lighttpd stop");
  system("cd /media/card/web; node app.js &");

  servo.attach(servoPin);

}
//-------------------------------------------LOOP----------------------------------------------/
void loop(){
  // Make the machine work
  machine.update();
}

//----------------------------STATE MACHINE FUNCTION DEFINITION---------------------------------/
void doorLocked_enter(){
  Serial.println("doorLocked_enter");
  input = "";
  lockDoor();
  beep();
  beep();
}

void doorLocked_update(){
  char key = keypad.getKey();
  // if it’s a valid key
  if (key) {
    // And it's a digit
    if ((key != '#') && (key != '*'))
    {
      input += key;
      Serial.println("digit: ");
      Serial.println(key);
      machine.transitionTo(stWritingKey);
    }else{
      beep();
    }
  }
}
void doorLocked_exit(){}

void doorUnlocked_enter(){
  Serial.println("doorUnlocked_enter");
  
  startMilis = millis();
  logAction("u",input);
  unlockDoor();
  beep();
}

void doorUnlocked_update(){
  
  beep();
  delay(100);
  if( analogRead(doorRead) == 0 ){
    machine.transitionTo(stDoorOpened);
  }
  
  if( millis() - startMilis > 15000 ){ // After 15 seconds
    machine.transitionTo(stDoorLocked);
  }
}

void doorUnlocked_exit(){}

void doorOpened_enter(){
  logAction("a",input);
}

void doorOpened_update(){
  if( analogRead(doorRead) == 1023 ){
    logAction("c","");
    machine.transitionTo(stDoorLocked);
  }
}

void doorOpened_exit(){}

void writingKey_enter(){
  Serial.println("writingKey_enter");
    beep();
}

void writingKey_update(){
  char key = keypad.getKey();
  // if it’s a valid key
  if (key) {
    beep();
    if ((key != '#') && (key != '*')){
      // And it's a digit
      input += key;
      Serial.println("digit: ");
      Serial.println(key);

      if( input.length() == 4 ){
        machine.transitionTo(stValidatingKey);
      }
    }else{
      machine.transitionTo(stDoorLocked);
    }
  }
}

void writingKey_exit(){}

void validatingKey_enter(){
  Serial.println("validatingKey_enter");
  if( isValidCode(input) ){
    machine.transitionTo(stDoorUnlocked);
  }else{
    machine.transitionTo(stInvalidKey);
  }
}

void validatingKey_update(){}

void validatingKey_exit(){}

void invalidKey_enter(){
  Serial.println("invalidKey_enter");
  startMilis = millis();
  logAction("i","");
}

void invalidKey_update(){
  beep();
  delay(300);

  
  if( millis() - startMilis > 3000 ){ // After 3 seconds
    machine.transitionTo(stDoorLocked);
  }
}

void invalidKey_exit(){}






//------------------------------------OTHER FUNCTIONS------------------------------------------/
void beep(){
  Serial.println("beep");
  digitalWrite(speaker,HIGH);
  delay(100);
  digitalWrite(speaker,LOW);
  delay(100);
}

// Locks the door physically
void lockDoor(){
  Serial.println("lockDoor");
  servo.write(180);
  system("redis-cli del door_flag &");
}

// Unlocks the door physically
void unlockDoor(){
  Serial.println("unlockDoor");
  servo.write(0);
  system("redis-cli set door_flag true &");
}

// Log an action (i = invalid code, a = door open, c = door closed) in the database
void logAction(String type, String code){
  Serial.println("logAction");
  String command = "cd /media/card/web/shell; perl log.pl " + type + " " + code + "&";
  system(command.buffer);
}

// Check if the given code is valid against the db
boolean isValidCode( String code ){
  
   String command = "perl /media/card/web/shell/validate.pl " + code;
   FILE *redisFile_p = popen(command.buffer, "r");

  if (!redisFile_p)
  {
    return -1;
  }

  char buffer[1024];
  char *line_p = fgets(buffer, sizeof(buffer), redisFile_p);
  pclose(redisFile_p);
  Serial.print(line_p);

  return (strncmp("Valid",line_p,3)==0);
}
