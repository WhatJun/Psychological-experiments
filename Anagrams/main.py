'''
Author: WenjunZHU
Date: 2024/08
'''


from psychopy import core, visual, gui, event
import random
import openpyxl as op
import pathlib

# Set the period of time for feedback display
FB_TIME = 1 

# Collect subject information through a dialog box
subj_info = {"ID": "", "Age": ""}
info_dlg = gui.DlgFromDict(subj_info)
if not info_dlg.OK:
    # Quit the experiment if the dialog is cancelled
    core.quit()

# Extract subject data from the dialog response
subID = subj_info["ID"]
subAge = subj_info["Age"]

# Set up the path for saving data
current_folder = pathlib.Path(__file__).parent
new_filename = f"{subID}_anagrams.csv"
new_filepath = current_folder / "datafiles" / new_filename

# Open a file for appending data and write column headers
datafile = open(new_filepath, mode='a')
datafile.write('ID,Age,Problem,Answer,Response,IfCorrect,ResponseTime\n')

# Load anagrams from an Excel file
anagrams = []
wb = op.load_workbook("./problems.xlsx")
sheet = wb.active
for row in sheet.iter_rows(min_row=2):
    anagram = []
    for col in row:
        anagram.append(col.value)
    anagrams.append(anagram)    

# Shuffle the list of anagrams
random.shuffle(anagrams)

# Create a full-screen window with a specific background color
win = visual.Window(units="norm", fullscr=True, color="#e6e6fa")

# Instruction and ending text
instText = '''
Rearrange the letters of the alphabet presented at
the top of the screen to make them into a real word.
'''
endText = "Thank you!!"

# Function to show instructions
def show_inst(text):
    inst = visual.TextStim(win, text=text, color="#000000", font="Times New Roman", height=0.15)
    inst.draw()
    win.flip()
    
    # Wait for the participant to press the space bar or escape key
    keys = event.waitKeys(keyList=["space", "escape"])
    if keys[0] == "escape":
        datafile.close()
        core.quit()

# Function to present a problem and collect the response
def presenter(prob):
    stimText = visual.TextStim(win, color="#000000", font="Times New Roman", pos=(0, 0.4), height=0.2)
    stimText.setText(prob)

    submitText = visual.TextStim(win, text="press the enter key \n to submit your answer", 
                                 color="#87ceeb", font="Times New Roman", pos=(0, -0.3))

    inputBox = visual.TextBox2(win, editable=True, 
                               text="",
                               color="#000000",
                               fillColor="#FFFFFF",
                               font="Times New Roman",
                               pos=(0, 0),
                               placeholder='Type here...',
                               letterHeight=0.1,
                               borderWidth=2, borderColor="#000000",
                               size=(1, 0.2),
                               alignment="center",
                               )
    
    inputBox.setAutoDraw(True)
    
    timer = core.Clock()

    while True:
        stimText.draw()
        submitText.draw()
        win.flip()

        keys = event.getKeys()
        inputBox.text = inputBox.text.replace(" ", "")

        if "return" in keys:
            inputBox.setAutoDraw(False)
            return inputBox.text.replace("\n", ""), timer.getTime()
        if "escape" in keys:
            datafile.close()
            core.quit()

# Function to check the correctness of the response
def checker(response, answer):
    if response == answer:
        return 1
    else:
        return 0

# Function to provide feedback
def feedbacker(if_correct):
    fbText = visual.TextStim(win, color="#000000", font="Times New Roman", height=0.2)
    if if_correct == 1:
        fb_content = "Correct"
    elif if_correct == 0:
        fb_content = "Incorrect"
    fbText.setText(fb_content)
    fbText.draw()
    win.flip()
    core.wait(FB_TIME)


show_inst(instText) # Display the instructions
# Iterate over each anagram problem, present it, collect response, and provide feedback
for problem, answer in anagrams:
    res, restime = presenter(problem)
    if_correct = checker(res, answer)
    feedbacker(if_correct)    
    data = "{},{},{},{},{},{},{}\n".format(subID, subAge, problem, answer, res, if_correct, restime)
    datafile.write(data)
show_inst(endText) # Display the ending text and close the data file and window
datafile.close()
win.close()
