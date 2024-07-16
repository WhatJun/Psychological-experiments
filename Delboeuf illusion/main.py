from psychopy import visual, core, gui, event
import random
import numpy as np
import pathlib

# Dictionary to collect subject information
subj_info = {"ID": "", "Age": "", "Sex": ["Male", "Female"]}

# Dialog box to input subject information
info_dlg = gui.DlgFromDict(subj_info)

# Quit the experiment if the dialog is cancelled
if not info_dlg.OK:
    core.quit()

# Extract subject data from the dialog response
subID = subj_info["ID"]
subAge = subj_info["Age"]
subSex = subj_info["Sex"]

# Set up the path for saving data
current_folder = pathlib.Path(__file__).parent
new_filename = f"{subID}_delboeuf.csv"
new_filepath = current_folder / "data" / new_filename

# Open a file for appending data and write column headers
datafile = open(new_filepath, mode='a')
datafile.write('ID,Age,Sex,trialID,csfront_size,csback_size,ss_defaultSize,ss_adjustedSize\n')

# Initialize global variables
trialNum = 0
adjustRange = 0.01  # adjustment step for the size

# Stimuli configuration for comparative stimuli (CS)
csPosList = [-0.45, 0.45]
csRadFrontList = np.arange(0.1, 0.31, 0.05)  # different sizes of front stimuli
csRadBackList = np.concatenate((csRadFrontList * 1.3, csRadFrontList * 1.8))  # sizes for back stimuli under two conditions
csRadFrontList = np.tile(csRadFrontList, 2)  # repeat front sizes to match the number of back sizes
cs_rad_list = list(zip(csRadFrontList, csRadBackList))
random.shuffle(cs_rad_list)  # randomize the order of stimuli pairs

# Standard stimulus (SS) configuration
ssPosList = [0.45, -0.45]
ssRadDefault = np.arange(0.08, 0.35, 0.05) 
ssRadDefault = np.tile(ssRadDefault, 2)
random.shuffle(ssRadDefault)  # randomize the default sizes for the standard stimuli

# Create a window for displaying stimuli
win = visual.Window(size=[800, 800], units='norm', fullscr=False)

# Text stimulus for instructions
instText = visual.TextStim(win)
instText.setText(
    '''
    Adjust the black circle in the lower right corner so that it is the same size as the black circle in the upper left corner.
    Press [↑] to make it one step larger. Press [↓] to make it one step smaller.
    It does not matter how many times you press [↑] or [↓].

    Press spacekey to start.
    '''
)
# Text stimulus for ending
endText = visual.TextStim(win)
endText.setText(
    '''
    Thank you!!!
    '''
)


# Function to display instructions and wait for key press
def show_inst(text):
    text.draw()
    win.flip()
    key = event.waitKeys(keyList=["space", "escape"])
    if key[0] == "escape":
        datafile.close()
        core.quit()

# Function to create and manage stimulus presentation and response recording
def stim_maker(cs_list, ss_list):
    # Create visual circles for the comparative stimuli (front and back)
    cir_cs_back = visual.Circle(win, radius=cs_list[trialNum][1], pos=csPosList, lineColor="#000000")
    cir_cs_front = visual.Circle(win, radius=cs_list[trialNum][0], pos=csPosList, lineColor="#000000", fillColor="#000000")

    # Set up and display the standard stimulus
    radius = ss_list[trialNum]  # initial radius
    cir_ss = visual.Circle(win, lineColor="#000000", fillColor="#000000") 
    cir_ss.setRadius(radius)
    cir_ss.setPos(ssPosList)

    # Display all stimuli and adjust according to participant input
    cir_cs_back.draw()
    cir_cs_front.draw()
    cir_ss.draw()
    win.flip()

    # Handle the adjustment input from the participant
    while True:
        resp = event.waitKeys(keyList=["up", "down", "space", "escape"])
        if resp[0] == "up" and radius + adjustRange <= 0.5:
            radius += adjustRange
        elif resp[0] == "down" and radius - adjustRange >= 0.05:
            radius -= adjustRange
        elif resp[0] == "space":
            break
        elif resp[0] == "escape":
            core.quit()

        # Update and show the adjusted size
        cir_ss.setRadius(radius)
        cir_ss.draw()
        cir_cs_back.draw()
        cir_cs_front.draw()
        win.flip()

    # Determine the condition based on the size ratio
    if 1.2 <= cs_list[trialNum][1] / cs_list[trialNum][0] <= 1.4:
        condition = "close"
    elif 1.5 <= cs_list[trialNum][1] / cs_list[trialNum][0] <= 1.9:
        condition = "far"
    data = f"{subID},{subAge},{subSex},{trialNum},{cs_list[trialNum][0]},{cs_list[trialNum][1]},{ssRadDefault[trialNum]},{radius},{condition}\n"
    datafile.write(data)

# Run the experiment
show_inst(instText)
for i in range(len(cs_rad_list)):
    stim_maker(cs_rad_list, ssRadDefault)
    trialNum += 1
show_inst(endText)

# Close file and window after completion of the experiment
datafile.close()
win.close()
