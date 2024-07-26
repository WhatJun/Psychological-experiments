from psychopy import core, visual, gui, event
import numpy
import random
import openpyxl as op


FB_TIME = 1 # the period of time of feedback


anagrams = []
wb = op.load_workbook("./problems.xlsx")
sheet = wb.active
for row in sheet.iter_rows(min_row=2):
    anagram = []
    for col in row:
        anagram.append(col.value)
    anagrams.append(anagram)    

random.shuffle(anagrams)
print(anagrams)

win = visual.Window(units="norm", fullscr=False)

# class anagramController:
#     def __init__(self, master):
#         self.master = master
        
def presenter(prob):
    stimText = visual.TextStim(win, color="#000000", font="MS Gothic")
    stimText.setText(prob)

    inputBox = visual.TextBox2(win, editable=True, 
                               text="",
                               font="MS Gothic", 
                               pos=(0, 0),
                               placeholder='Type here...',
                               letterHeight=0.1,
                               borderWidth=2,
                               size=(1, 0.2))
    
    while True:
        stimText.draw()
        inputBox.draw()
        win.flip()

        keys = event.waitKeys()
        if "return" in keys:
            return inputBox.text
        if "escape" in keys:
            core.quit()
        
def checker(respone, answer):
    if respone == answer:
        return 1
    else:
        return 0

def feedbacker(if_correct):
    fbText = visual.TextStim(win, color="#000000", font="MS Gonthic")
    if if_correct == 1:
        fb_content = "正解"
    elif if_correct == 0:
        fb_content = "不正解"
    fbText.setText(fb_content)
    fbText.draw()
    win.flip()
    core.wait(FB_TIME)
    
for problem, answer in anagrams:
    res = presenter(problem)
    print(res)
    if_correct = checker(res, answer)
    feedbacker(if_correct)    

win.close()