from datetime import datetime,timedelta

def calculate_course_datetime(start_date,weeks):
    end_date=start_date+timedelta(weeks=weeks)
    return end_date

